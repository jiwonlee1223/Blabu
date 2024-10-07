import request from 'request';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // 고유한 ID 생성을 위한 패키지

const client_id = 'lyf4xrfv4e';
const client_secret = 'WFsByeNYTuCynOSlOgpaDbgtmX42CrpOttGRFphg';

export const convertTextToTTS = (text, callback) => {
  const api_url = 'https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts';
  const fileName = `tts_${uuidv4()}.mp3`; // 고유한 파일명 생성
  
  const options = {
    url: api_url,
    form: { speaker: 'nara', volume: '0', speed: '-1', pitch: '0', text: text, format: 'mp3' },
    headers: { 'X-NCP-APIGW-API-KEY-ID': client_id, 'X-NCP-APIGW-API-KEY': client_secret },
  };

  const filePath = `./public/tts/${fileName}`;
  const writeStream = fs.createWriteStream(filePath);
  
  request.post(options).pipe(writeStream).on('close', () => {
    callback(fileName);
  });
};
