// 각각 type 에 지정된 조건들을 검사한다. 예를들어 text type은 10자 이내로 한다. 그 이상은 적용되지 않는다.
import { IsEmail } from "class-validator";
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

	@Column({ type: "boolean", default: false })
	isDriving: boolean;

	@Column({ type: "boolean", default: false })
	isRiding: boolean;

	@Column({ type: "boolean", default: false })
	isTaken: boolean;

	// double precision -> PostgresQL 에서 지원하는 float 대체 타입
	@Column({ type: "double precision", default: 0 })
	lastLng: number;

	@Column({ type: "double precision", default: 0 })
	lastLat: number;

	@Column({ type: "double precision", default: 0 })
	lastOrientation: number;

	// 메소드를 만들어 fullName = firstName + lastName 생성
	get fullName(): string {
		return `${this.firstName} ${this.lastName}`;
	}

	@CreateDateColumn() createdAt: string;
	@UpdateDateColumn() updatedAt: string;
}

export default User;
