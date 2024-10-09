// config
import { envSendGrid } from '../../../config/env'
import { sendGrid } from '../../../config/sendgrid'

// modules handlers
import { firebaseVerifyIdToken } from '../../../modules/handlers/firebase'
import {
  timestampConvertDatetimeJp,
  firestoreGetRoom,
  firestoreGetIsEmailGroups,
  firestoreGetIsEmailParticipateUsers,
  firestoreGetUser,
} from '../../../modules/handlers/firestore'
import { utilsGetInvitationLoginLink } from '../../../modules/handlers/utils'

// 型モジュール
import { ApiAllInvitationReqParams } from '../../../../modules/types/api'

const isRequestBody = (data: any): data is ApiAllInvitationReqParams =>
  data !== null && typeof data.roomUid === 'string'

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
const getSendUserItems = async (roomUid: string): Promise<dynamicTemplateParams[]> => {
  const sendUserItems: dynamicTemplateParams[] = []

  // データの取得
  const roomItem = await firestoreGetRoom(roomUid)
  const ownerUserItem = await firestoreGetUser(roomItem.userUid)
  const groupItems = await firestoreGetIsEmailGroups(roomUid)
  const participateUserItems = await firestoreGetIsEmailParticipateUsers(roomUid)

  // データの整形
  groupItems.forEach((item) => {
    sendUserItems.push({
      email: item.email as string,
      user_name: item.displayName,
      room_owner_name: ownerUserItem?.nickname as string,
      room_name: roomItem.name,
      start_datetime: timestampConvertDatetimeJp(roomItem.startAt),
      voting_end_datetime: timestampConvertDatetimeJp(roomItem.votingEndAt),
      browsing_end_datetime: timestampConvertDatetimeJp(roomItem.browsingEndAt),
      login_url: utilsGetInvitationLoginLink({
        roomUid: roomItem.uid as string,
        type: 'group',
        groupUid: item.uid,
        loginToken: item.loginToken,
      }),
    })
  })
  participateUserItems.forEach((item) => {
    sendUserItems.push({
      email: item.email as string,
      user_name: item.displayName,
      room_owner_name: ownerUserItem?.nickname as string,
      room_name: roomItem.name,
      start_datetime: timestampConvertDatetimeJp(roomItem.startAt),
      voting_end_datetime: timestampConvertDatetimeJp(roomItem.votingEndAt),
      browsing_end_datetime: timestampConvertDatetimeJp(roomItem.browsingEndAt),
      login_url: utilsGetInvitationLoginLink({
        roomUid: roomItem.uid as string,
        type: 'participateUser',
        participateUserUid: item.uid,
        loginToken: item.loginToken,
      }),
    })
  })

  return sendUserItems
}

const sendMail = (templateId: string, sendUserItems: dynamicTemplateParams[]): Promise<any> =>
  Promise.all(
    sendUserItems.map((item) =>
      sendGrid.send({
        to: item.email.replace(/\r?\n/g, ''),
        from: envSendGrid.email.noreply.replace(/\r?\n/g, ''),
        templateId,
        dynamicTemplateData: item,
      })
    )
  )

export default async (req: any, res: any) => {
  try {
    const data = req.body
    if (!isRequestBody(data)) throw new Error('Reqest Body is not match')
    const decodedIdToken = await firebaseVerifyIdToken(req)
    if (!decodedIdToken.uid) throw new Error('Not Permission Error.')

    const { roomUid } = data
    const templateId = envSendGrid.templateId.invitation

    const sendUserItems = await getSendUserItems(roomUid)
    await sendMail(templateId, sendUserItems)

    res.status(200).end()
  } catch (err) {
    console.error('invitationAll関数でエラーが発生しました')
    console.error(err)
    res.status(500).end()
  }
}
