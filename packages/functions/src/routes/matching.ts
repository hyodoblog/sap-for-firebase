import { https, region, RuntimeOptions } from 'firebase-functions'
import { roomsRef } from '../config/firebase'

// modules handlers
import matchingHandlers from '../modules/handlers/matching'

// modules types
import { Room } from '../modules/types/models'

// ********
// handlers
// ********

const getRoomItem = async (roomUid: string): Promise<Room> => {
  const doc = await roomsRef.doc(roomUid).get()
  if (doc.exists) {
    return {
      uid: doc.id,
      ...doc.data(),
    } as Room
  } else throw Error('room not found.')
}

// ********
// main関数
// ********

async function main(data: any, context: https.CallableContext) {
  console.info('matching関数実行開始')

  try {
    if (!context.auth?.uid) throw new Error('not Auth')
    const roomUid = data.roomUid
    if (!roomUid) throw new Error('request body is not.')

    // 稼働中のroomの取得
    const roomItem = await getRoomItem(roomUid)

    // matching
    await matchingHandlers([roomItem])
    console.info('matching関数実行成功')
  } catch (err) {
    console.info('matching関数実行エラー')
    console.error(err)
    throw Error
  }

  console.info('matching関数実行終了')
}

// *************
// functions設定
// *************

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 540,
  memory: '256MB',
}

module.exports = module.exports = region('asia-northeast1').runWith(runtimeOpts).https.onCall(main)
