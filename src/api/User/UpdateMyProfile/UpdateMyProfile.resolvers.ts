import User from "../../../entities/User";
import {
	UpdateMyProfileMutationArgs,
	UpdateMyProfileResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import cleanNullArgs from "../../../utils/cleanNullArgs";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		UpdateMyProfile: privateResolver(
			async (
				_,
				args: UpdateMyProfileMutationArgs,
				{ req },
			): Promise<UpdateMyProfileResponse> => {
				// user는 User Entity 의 Instance 이다.
				const user: User = req.user;
				// User.update 함수에서 두번째 인자로 { ...args } 를 업데이트로 넘기면 type 에러가 난다.
				// null 인 type 들은 User Scheme 에서 충돌하기 때문이다. User type 들은 null 이 없는 필수 type 들로 지정되어 있기 때문
				// 이를 위해 null 로 들어오는 인자들을 걸러내는 과정이 필요하다.
				const notNull: any = cleanNullArgs(args);
				// 그러나 실제로 savePassword 함수가 적용되는 @BeforeUpdate 가 작동하지 않는다. 왜일까?
				// Typeorm 버그처럼 보이는 이 update 메소드는 사용자 존재 여부를 확인하지도 않으며 선택하지도 않기 때문이다.
				// 결국 @BeforeUpdate, @BeforeInsert 를 하기 위해선 존재여부를 확인하고 선택해 저장하는 User.save() 해야 한다.
				if (notNull.password !== null) {
					user.password = notNull.password;
					user.save(); // 실제로 비밀번호 업데이트 이뤄지는 부분
					delete notNull.password; // Hashing 되지 않은 password 가 다시 저장되지 않도록 notNull.password 를 삭제
				}
				try {
					await User.update({ id: user.id }, { ...notNull });
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
			},
		),
	},
};

export default resolvers;
