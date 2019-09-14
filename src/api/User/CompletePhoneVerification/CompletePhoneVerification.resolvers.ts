import User from "../../../entities/User";
import Verification from "../../../entities/Verification";
import {
	CompletePhoneVerificationMutationArgs,
	CompletePhoneVerificationResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";

const resolvers: Resolvers = {
	Mutation: {
		CompletePhoneVerification: async (
			_,
			args: CompletePhoneVerificationMutationArgs,
		): Promise<CompletePhoneVerificationResponse> => {
			const { phoneNumber, key } = args;
			// 인증 완료 여부 확인, 폰 번호, 키 입력 값
			try {
				const verification = await Verification.findOne({
					payload: phoneNumber,
					key,
				});
				if (!verification) {
					return {
						ok: false,
						error: "인증된 키가 확인되지 않습니다.",
						token: null,
					};
				} else {
					verification.verified = true; // 인증에는 인증됐다고 남기고
					verification.save(); // DB 저장
				}
			} catch (error) {
				return {
					ok: false,
					error: error.message,
					token: null,
				};
			}

			try {
				const user = await User.findOne({ phoneNumber });
				if (user) {
					user.verifiedPhoneNumber = true; // 사용자에겐 인증된 폰 번호라고 알려주고
					user.save(); // DB 저장
					return {
						ok: true,
						error: null,
						token: "인증이 완료 되었습니다.",
					};
				} else {
					// 할당된 User 가 아예 없는 경우
					return {
						ok: false,
						error: null,
						token: null,
					};
				}
			} catch (error) {
				return {
					ok: false,
					error: error.message,
					token: null,
				};
			}
		},
	},
};

export default resolvers;
