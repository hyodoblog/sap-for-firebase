// config
import { envSendGrid } from '../../../../config/env'
import { sendGrid } from '../../../../config/sendgrid'

// modules handlers
import { firebaseVerifyIdToken } from '../../../../modules/handlers/firebase'
import {
  timestampConvertDatetimeJp,
  firestoreGetRoom,
  firestoreGetUser,
  firestoreGetParticipateUserItem,
} from '../../../../modules/handlers/firestore'
import { utilsGetInvitationLoginLink } from '../../../../modules/handlers/utils'

// 型モジュール
import { ApiParticipateUserInvitationReqParams } from '../../../../../modules/types/api'

const isRequestBody = (data: any): data is ApiParticipateUserInvitationReqParams =>
  data !== null && typeof data.roomUid === 'string' && typeof data.participateUserUid === 'string'

/* eslint-disable */
interface dynamicTemplateParams {
  email: string
  user_name: string
  room_owner_name: string
  room_name: string
  login_url: string
  start_datetime: string
  voting_end_datetime: string
  browsing_end_datetime: string
}
const getSendUserItem = async (roomUid: string, participateUserUid: string): Promise<dynamicTemplateParams> => {
  // データの取得
  const roomItem = await firestoreGetRoom(roomUid)
  const ownerUserItem = await firestoreGetUser(roomItem.userUid)
  const participateUserItem = await firestoreGetParticipateUserItem(roomUid, participateUserUid)

  // データの整形
  const sendUserItem: dynamicTemplateParams = {
    email: participateUserItem.email as string,
    user_name: participateUserItem.displayName,
    room_owner_name: ownerUserItem?.nickname as string,
    room_name: roomItem.name,
    start_datetime: timestampConvertDatetimeJp(roomItem.startAt),
    voting_end_datetime: timestampConvertDatetimeJp(roomItem.votingEndAt),
    browsing_end_datetime: timestampConvertDatetimeJp(roomItem.browsingEndAt),
    login_url: utilsGetInvitationLoginLink({
      roomUid: roomItem.uid as string,
      type: 'participateUser',
      participateUserUid: participateUserItem.uid,
      loginToken: participateUserItem.loginToken,
    }),
  }

  return sendUserItem
}

const sendMail = (templateId: string, params: dynamicTemplateParams): Promise<any> =>
  sendGrid.send({
    to: params.email,
    from: envSendGrid.email.noreply.replace(/\r?\n/g, ''),
    templateId,
    dynamicTemplateData: params,
  })

export default async (req: any, res: any) => {
  try {
    const data = req.body
    if (!isRequestBody(data)) throw new Error('Reqest Body is not match')
    const decodedIdToken = await firebaseVerifyIdToken(req)
    if (!decodedIdToken.uid) throw new Error('Not Permission Error.')

    const { roomUid, participateUserUid } = data
    const templateId = envSendGrid.templateId.invitation

    const sendUserItem = await getSendUserItem(roomUid, participateUserUid)
    await sendMail(templateId, sendUserItem)

    res.status(200).end()
  } catch (err) {
    console.error('participateUserInvitation関数でエラーが発生しました')
    console.error(err)
    res.status(500).end()
  }
}
