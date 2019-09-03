import { verificationTarget } from "src/types/types";
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

class Verification extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({ type: "text", enum: ["PHONE", "EMAIL"] })
	target: verificationTarget;

	@Column({ type: "text" })
	payload: string;

	@Column({ type: "text" })
	key: string;

	@Column({ type: "boolean", default: false })
	used: boolean;

	@CreateDateColumn() createdAt: string;
	@UpdateDateColumn() updatedAt: string;
}

export default Verification;
