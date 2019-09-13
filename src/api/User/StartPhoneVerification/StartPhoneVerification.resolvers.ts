import Verification from "../../../entities/Verification";
import {
	StartPhoneVerificationMutationArgs,
	StartPhoneVerificationResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";

const resolvers: Resolvers = {
	Mutation: {
		StartPhoneVerification: async (
			_,
			args: StartPhoneVerificationMutationArgs,
		): Promise<StartPhoneVerificationResponse> => {
			const { phoneNumber } = args;
			try {
				const existingVerification = await Verification.findOne({
					payload: phoneNumber,
				});
				// 존재하는 인증이 있는지 여부, 이미 존재하는 인증은 제거
				if (existingVerification) {
					existingVerification.remove();
				}
				// SMS 인증번호를 받기 위해 client 폰 번호를 서버측에 보낸다.
				// 결과적으로 인증된 건이 있건 없건 새로 생성함, 그리고 저장함
				const newVerification = await Verification.create({
					payload: phoneNumber,
					target: "PHONE",
				}).save();
				// to do: send sms
			} catch (error) {
				return {
					ok: false,
					error: error.message,
				};
			}
		},
	},
};

export default resolvers;
