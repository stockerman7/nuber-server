import bcrypt from "bcrypt"; // password 암호화(encryption)에 사용
// 각각 type 에 지정된 조건들을 검사한다. 예를들어 text type은 10자 이내로 한다. 그 이상은 적용되지 않는다.
import { IsEmail } from "class-validator";
import {
	BaseEntity,
	BeforeInsert,
	BeforeUpdate,
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
// User는 Chat, Message 와 상호관계를 설정해야 한다.
import Chat from "./Chat";
import Message from "./Message";
import Place from "./Place";
import Ride from "./Ride";

const BCRYPT_ROUNDS = 10; // 몇번 암호화 할 것인지

@Entity()
class User extends BaseEntity {
	// 메소드를 만들어 fullName = firstName + lastName 생성
	get fullName(): string {
		return `${this.firstName} ${this.lastName}`;
	}
	@PrimaryGeneratedColumn() id: number;
	// nullable 은 없을 수도 있다는 뜻임
	@Column({ type: "text", nullable: true })
	@IsEmail()
	email: string | null;

	@Column({ type: "boolean", default: false })
	verifiedEmail: boolean;

	@Column({ type: "text" })
	firstName: string;

	@Column({ type: "text" })
	lastName: string;

	@Column({ type: "int", nullable: true })
	age: number;

	@Column({ type: "text", nullable: true })
	password: string;

	@Column({ type: "text", nullable: true })
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

	@Column({ type: "text", nullable: true })
	fbID: string;

	// 한명의 User는 다수의 Chat 상대(passenger, driver)가 있다.
	@OneToMany(type => Chat, chat => chat.passenger)
	chatsAsPassenger: Chat[];

	@OneToMany(type => Chat, chat => chat.driver)
	chatsAsDriver: Chat[];

	// 한명의 User는 다수의 메세지를 보낼 수 있다.
	@OneToMany(type => Message, message => message.user)
	messages: Message[]; // 다수에는 '[]' 배열이 붙은 것에 유념

	// User는 승객(passenger), 운전자(driver) 둘로 구분할 수 있다.
	// 타는 것은 운전자나 승객 둘다 다수에 포함된다.
	@OneToMany(type => Ride, ride => ride.passenger)
	ridesAsPassenger: Ride[];

	@OneToMany(type => Ride, ride => ride.driver)
	ridesAsDriver: Ride[];

	@OneToMany(type => Place, place => place.user)
	places: Place[];

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;

	// 사용자가 보낸 password 와 이전에 hash(암호화)한 password 를 비교
	public comparePassword(password: string): Promise<boolean> {
		return bcrypt.compare(password, this.password);
	}
	// 미리 사전처리 할 것들(만약 무엇인가를 저장하거나 업데이트를 한다면, 예를들어 암호화된 비밀번호를 얻어오는 것 처럼)
	@BeforeInsert()
	@BeforeUpdate()
	async savePassword(): Promise<void> {
		// void는 return 값을 말한다. 즉 반환 값이 없는 Promise 타입이다.
		if (this.password) {
			// awiat: 처리가 완료 될 때까지 기다렸다가 반환(비동기 Promise의 동기 작업이 필요할 시)
			const hashedPassword = await this.hashPassword(this.password);
			this.password = hashedPassword; // 암호화된 password 저장
		}
	}
	// password를 암호화하는 private(접근제한) 함수, string 타입인 hash 값을 반환하는 Promise
	private hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, BCRYPT_ROUNDS); // password 를 hash 화 한다. 두번째 매개변수는 몇번 암호화 할지 숫자
	}
}

export default User;
