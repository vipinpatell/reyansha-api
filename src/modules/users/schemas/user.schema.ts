import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  EMPLOYMENT_TYPES,
  USER_DEPARTMENTS,
  USER_GENDERS,
  USER_PREFIXES,
  USER_TYPES,
  WORK_LOCATIONS,
} from '../user.constants.js';

@Schema({ _id: false })
export class UserName {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;
}

const UserNameSchema = SchemaFactory.createForClass(UserName);

@Schema({ _id: false })
export class UserMobile {
  @Prop({ required: true, trim: true })
  primary!: string;

  @Prop({ trim: true })
  alternate?: string;
}

const UserMobileSchema = SchemaFactory.createForClass(UserMobile);

@Schema({ _id: false })
export class UserAddress {
  @Prop({ required: true, trim: true })
  building!: string;

  @Prop({ required: true, trim: true })
  streetAddress!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ required: true, trim: true })
  state!: string;

  @Prop({ required: true, trim: true })
  postalCode!: string;

  @Prop({ required: true, trim: true })
  country!: string;
}

const UserAddressSchema = SchemaFactory.createForClass(UserAddress);

@Schema({ _id: false })
export class UserEmergencyContact {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  phone!: string;
}

const UserEmergencyContactSchema =
  SchemaFactory.createForClass(UserEmergencyContact);

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ enum: USER_PREFIXES })
  prefix?: string;

  @Prop({ type: UserNameSchema, required: true })
  name!: UserName;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({ required: true, type: Date })
  dob!: Date;

  @Prop({ required: true, enum: USER_GENDERS })
  gender!: string;

  @Prop({ type: UserMobileSchema, required: true })
  mobile!: UserMobile;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: UserAddressSchema, required: true })
  address!: UserAddress;

  @Prop({ type: String, default: null, trim: true })
  profileImage!: string | null;

  @Prop({ trim: true, maxlength: 100 })
  designation?: string;

  @Prop({ enum: USER_TYPES })
  userType?: string;

  @Prop({ enum: USER_DEPARTMENTS })
  department?: string;

  @Prop({ trim: true, maxlength: 50 })
  employeeId?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reportingManager?: Types.ObjectId;

  @Prop({ type: Date })
  joiningDate?: Date;

  @Prop({ enum: EMPLOYMENT_TYPES })
  employmentType?: string;

  @Prop({ enum: WORK_LOCATIONS })
  workLocation?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String, maxlength: 2000, trim: true })
  notes?: string;

  @Prop({ type: UserEmergencyContactSchema })
  emergencyContact?: UserEmergencyContact;

  @Prop({ lowercase: true, trim: true, maxlength: 254 })
  alternateContactEmail?: string;

  @Prop({ type: [String], default: [] })
  skills!: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ 'mobile.primary': 1 }, { unique: true });
UserSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
