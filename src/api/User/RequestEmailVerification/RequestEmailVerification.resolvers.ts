import User from "../../../entities/User";
import Verification from "../../../entities/Verification";
import { RequestEmailVerificationResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";
import { sendVerificationEmail } from "../../../utils/sendEmail";

const resolvers: Resolvers = {
	Mutation: {
		RequestEmailVerification: privateResolver(
			async (_, __, { req }): Promise<RequestEmailVerificationResponse> => {
				const user: User = req.user;
				// 작성된 이메일이 인증이 안된 새로운 이메일이라면
				if (user.email && !user.verifiedEmail) {
					try {
						// 이전에 인증된 이메일은 DB에서 제거한다.
						const oldVerification = await Verification.findOne({
							payload: user.email,
						});
						if (oldVerification) {
							oldVerification.remove();
						}
						// 새로운 이메일 인증 생성, DB에 저장해 나중에 인증을 완료할 때 key 를 확인한다.
						const newVerification = await Verification.create({
							payload: user.email,
							target: "EMAIL",
						}).save();
						// Client 이메일 인증을 위한 Private Key 전송
						await sendVerificationEmail(user.fullName, newVerification.key);
						return {
							ok: true,
							error: null,
						};
						// 인증이 안된 경우
					} catch (error) {
						return {
							ok: false,
							error: error.message,
						};
					}
				// 나머지는 이메일 인증이 완료된 경우, 인증 받을 이메일이 없는 경우
				} else {
					return {
						ok: false,
						error: "사용자가 인증할 이메일이 없습니다.",
					};
				}
			},
		),
	},
};

export default resolvers;
