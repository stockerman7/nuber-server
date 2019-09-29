import jwt from "jsonwebtoken";
import User from "../entities/User";

// Custom Middleware, 사용자(Client) 측에서 받은 token 을 복호화, 반환은 DB 사용자 정보거나 없을 수 있다.
const decodeJWT = async (token: string): Promise<User | undefined> => {
	try {
		// Private Key 로 Token 을 복호화해 인증한다.
		const decoded: any = jwt.verify(token, process.env.JWT_TOKEN || "");
		const { id } = decoded;
		const user = await User.findOne({ id });
		return user;
	} catch (error) {
		return undefined;
	}
};

export default decodeJWT;
