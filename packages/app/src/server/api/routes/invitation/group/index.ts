// config
import { envSendGrid } from '../../../../config/env'
import { DynamicTemplateParams, sendGrid } from '../../../../config/sendgrid'

// modules handlers
import { firebaseVerifyIdToken } from '../../../../modules/handlers/firebase'
import {
  timestampConvertDatetimeJp,
  firestoreGetRoom,
  firestoreGetUser,
  firestoreGetGroupItem,
} from '../../../../modules/handlers/firestore'
import { utilsGetInvitationLoginLink } from '../../../../modules/handlers/utils'

// 型モジュール
import { ApiGroupInvitationReqParams } from '../../../../../modules/types/api'

const isRequestBody = (data: any): data is ApiGroupInvitationReqParams =>
  data !== null && typeof data.roomUid === 'string' && typeof data.groupUid === 'string'

const getSendUserItem = async (roomUid: string, groupUid: string): Promise<DynamicTemplateParams> => {
  // データの取得
  const roomItem = await firestoreGetRoom(roomUid)
  const ownerUserItem = await firestoreGetUser(roomItem.userUid)
  const groupItem = await firestoreGetGroupItem(roomUid, groupUid)

  // データの整形
  const sendUserItem: DynamicTemplateParams = {
    email: groupItem.email as string,
    user_name: groupItem.displayName,
    room_owner_name: ownerUserItem?.nickname as string,
    room_name: roomItem.name,
    start_datetime: timestampConvertDatetimeJp(roomItem.startAt),
    voting_end_datetime: timestampConvertDatetimeJp(roomItem.votingEndAt),
    browsing_end_datetime: timestampConvertDatetimeJp(roomItem.browsingEndAt),
    login_url: utilsGetInvitationLoginLink({
      roomUid: roomItem.uid as string,
      type: 'group',
      groupUid: groupItem.uid,
      loginToken: groupItem.loginToken,
    }),
  }

  return sendUserItem
}

const sendMail = (templateId: string, params: DynamicTemplateParams): Promise<any> =>
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

    const { roomUid, groupUid } = data
    const templateId = envSendGrid.templateId.invitation

    const sendUserItem = await getSendUserItem(roomUid, groupUid)
    await sendMail(templateId, sendUserItem)

    res.status(200).end()
  } catch (err) {
    console.error('groupInvitation関数でエラーが発生しました')
    console.error(err)
    res.status(500).end()
  }
}
