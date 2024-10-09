import sgMail from '@sendgrid/mail'
import { envSendGrid } from './env'

sgMail.setApiKey(envSendGrid.apiKey)

export const sendGrid = sgMail

export interface DynamicTemplateParams {
  email: string
  user_name: string
  room_owner_name: string
  room_name: string
  login_url: string
  start_datetime: string
  voting_end_datetime: string
  browsing_end_datetime: string
}

export const sendMail = async (sendUserItem: DynamicTemplateParams) => {
  await sendGrid.send({
    to: sendUserItem.email.replace(/\r?\n/g, ''),
    from: envSendGrid.email.noreply.replace(/\r?\n/g, ''),
    subject: '研究室マッチングへの招待状',
    html: `
<p>${sendUserItem.user_name}様</p>

<p>ようこそ、</p>
<p>研究室マッチングシステムへ！</p>

<p>${sendUserItem.room_owner_name}様から「${sendUserItem.room_name}」部屋への招待がきております。</p>

<p>開始日時・・・・・・・・・・・${sendUserItem.start_datetime}</p>
<p>投票終了日時・・・・・・・・・${sendUserItem.voting_end_datetime}</p>
<p>マッチング結果閲覧終了日時・・${sendUserItem.browsing_end_datetime}</p>

<p>以下の「参加する」ボタンよりアクセスして参加してください。</p>

<p>しない場合は、このメッセージは無視してください。</p>

<a href="${sendUserItem.login_url}">参加する</a>

<p>＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊</p>
<p>運営者・・・株式会社YOSHINANI</p>
<p>Web・・・・https://yoshinani.co.jp</p>
<p>＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊</p>
    `,
  })
}
