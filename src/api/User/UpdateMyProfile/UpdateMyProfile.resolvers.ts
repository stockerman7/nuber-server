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
				const user: User = req.user;
				// User.update 함수에서 두번째 인자로 { ...args } 를 업데이트로 넘기면 type 에러가 난다.
				// null 인 type 들은 User Scheme 에서 충돌하기 때문이다. User type 들은 null 이 없는 필수 type 들로 지정되어 있기 때문
				// 이를 위해 null 로 들어오는 인자들을 걸러내는 과정이 필요하다.
        const notNull: any = cleanNullArgs(args);
        // const user: User 는 BeforeUpdate 요청이 적용되지 않는다. 왜일까?
        // BeforeUpdate 를 하기 위해선 이미 이전에 User Instance 가 DB 에 저장된(User.save) 이력이 있어야 하기 때문이다.
        // 그렇게 하지 않고 User.update 하면 Object 존재 여부를 확인하지 않고 password 는 업데이트 안된다.
				if (notNull.password !== null) {
					user.password = notNull.password;
					user.save(); // 이제 DB 에 저장된 이력이 생겼으니 업데이트도 가능하다.
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
