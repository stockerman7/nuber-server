import Mailgun from "mailgun-js";

// 이메일 인증 API 연결
const mailGunClient = new Mailgun({
	apiKey: process.env.MAILGUN_API_KEY || "",
	domain: "sandbox05dde9880f514a26ba4f58835af4a58b.mailgun.org",
});

// 이메일 인증 API 를 통해 전달할 대상과 내용들
const sendEmail = (subject: string, html: string) => {
	const emailData = {
		from: "stockerman7@gmail.com",
		to: "stockerman7@gmail.com",
		subject,
		html,
	};
	return mailGunClient.messages().send(emailData);
};

// 실제로 인증 이메일을 보내는 역할
export const sendVerificationEmail = (fullName: string, key: string) => {
	const emailSubject = `안녕하세요. ${fullName}님, 당신의 이메일 인증입니다.`;
	const emailBody = `<a href="http://nuber.com/verification/${key}/">여기<a>를 클릭해 당신의 이메일을 인증해주세요.`;
	sendEmail(emailSubject, emailBody);
};
