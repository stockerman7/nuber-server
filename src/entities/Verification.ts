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

	// 한명의 User는 수많은 확인 절차를 받을 수 있다.
	@ManyToOne(type => User, user => user.verifications)
	user: User;

	@CreateDateColumn()
	createdAt: string;
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
