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

export const sendMail = (templateId: string, sendUserItem: DynamicTemplateParams) => {
  sendGrid.send({
    to: sendUserItem.email.replace(/\r?\n/g, ''),
    from: envSendGrid.email.noreply.replace(/\r?\n/g, ''),
    templateId,
    html: ``,
  })
}
