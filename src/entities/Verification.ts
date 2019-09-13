import { verificationTarget } from "src/types/types";
import {
	BaseEntity,
	BeforeInsert,
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

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

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;

	// 핸드폰, 이메일을 인증하기 위한 키를 생성하는 부분
	// 핸드폰은 5자리 숫자, 이메일은 무작위 문자와 숫자의 나열로 키를 생성한다.
	@BeforeInsert()
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
