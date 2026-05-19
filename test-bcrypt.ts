
import bcrypt from "bcryptjs";

async function test() {
  const password = "password123";
  const hash = await bcrypt.hash(password, 10);
  console.log("Hash:", hash);
  const match = await bcrypt.compare(password, hash);
  console.log("Match:", match);
}

test();
