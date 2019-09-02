import { IsEmail } from "class-validator"; // 각각 type 에 지정된 조건들을 검사한다. 예를들어 text type은 10자 이내로 한다. 그 이상은 적용되지 않는다.
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity()
class User extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({ type: "text", unique: true }) // unique: 유일한 값을 가지는
	@IsEmail()
	email: string;

	@Column({ type: "boolean", default: false })
	verifiedEmail: boolean;

	@Column({ type: "text" })
	firstName: string;

	@Column({ type: "text" })
	lastName: string;

	@Column({ type: "int" })
	age: number;

	@Column({ type: "text" })
	password: string;

	@Column({ type: "text" })
	phoneNumber: string;

	@Column({ type: "boolean", default: false })
	verifiedPhoneNumber: boolean;

	@Column({ type: "text" })
	profilePhoto: string;

	@CreateDateColumn() createdAt: string;
	@UpdateDateColumn() updatedAt: string;
}

export default User;
