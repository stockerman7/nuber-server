import { verificationTarget } from "src/types/types";
import {
	BaseEntity,
	BeforeInsert,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import User from "./User";

const PHONE = "PHONE";
const EMAIL = "EMAIL";

@Entity()
class Verification extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({ type: "text", enum: [PHONE, EMAIL] })
	target: verificationTarget;

	@Column({ type: "text" })
	payload: string;

	@Column({ type: "text" })
	key: string;

	@Column({ type: "boolean", default: false })
	used: boolean;

	// 한명의 User는 받았던 수많은 인증을 알 수 있다. nullable 은 user 없이도 인증을 생성할 수 있다는 뜻이다.
	// 즉 이메일 인증이 필요할 시에만 User 를 가지도록 한다. 휴대폰 인증은 StartPhoneVerification 에서 한다.
	// @ManyToOne(type => User, user => user.verifications, { nullable: true })
	// user: User;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;

	@BeforeInsert() // 테스트로 전화번호, 이메일을 생성.
	createKey(): void {
		if (this.target === PHONE) {
			this.key = Math.floor(Math.random() * 100000).toString();
		} else if (this.target === EMAIL) {
			this.key = Math.random()
				.toString(36) // '36' 은 숫자를 문자로 바꿔준다.
				.substr(2);
		}
	}
}

export default Verification;
