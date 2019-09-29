import Verification from "../../../entities/Verification";
import { RequestEmailVerificationResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";
import { sendVerificationEmail } from "../../../utils/sendEmail";

const resolvers: Resolvers = {
	Mutation: {
		RequestEmailVerification: privateResolver(
			async (_, __, { req }): Promise<RequestEmailVerificationResponse> => {
				const { user } = req;
				if (user.email) {
					try {
            // 이전에 인증된 이메일은 제거한다.
						const oldVerification = await Verification.findOne({
							payload: user.email,
						});
						if (oldVerification) {
							oldVerification.remove();
            }
            // 새로운 이메일 인증 생성
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
					} catch (error) {
						return {
							ok: false,
							error: error.message,
						};
					}
				} else {
					return {
						ok: false,
						error: "사용자를 확인할 이메일이 없습니다.",
					};
				}
			},
		),
	},
};

export default resolvers;
