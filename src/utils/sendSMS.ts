// 여기서는 Twilio 서버 측에서 SMS 인증을 사용자에게 보낸다.
// 특히 SMS 인증 번호를 생성하는 함수, 보내는 함수를 따로 만드는 것이 좋다.
import Twilio from "twilio";

const twilioClient = Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// SMS 인증 번호를 생성하는 부분
export const sendSMS = (to: string, body: string) => {
	// client 에게 message 를 새로 create(생성) 해서 보낸다.
	return twilioClient.messages.create({
		body, // body 가 인증번호일 것이다.
		to,
		from: process.env.TWILIO_PHONE, // SMS를 보내는 서버측(Twilio) 폰 번호
	});
};

// SMS 인증 번호를 보내는 부분
export const sendVerificatoinSMS = (to: string, key: string) => {
	sendSMS(to, `다음과 같은 인증번호를 입력해주세요: ${key}`);
};
