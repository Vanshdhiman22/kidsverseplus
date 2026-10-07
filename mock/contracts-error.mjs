// Shared error primitive, separated to keep schema validators cycle-free.
export class MockError extends Error {
 constructor(status,message,code,details={}){super(message);this.status=status;this.code=code;this.details=details}
}
export const reject=(status,message,code,details)=>{throw new MockError(status,message,code,details)}
