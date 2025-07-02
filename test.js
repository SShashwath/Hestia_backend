import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function run() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a therapy assistant who gives short replies  ONLY REPLY TO THERAPY RELATED QUESTIONS, IF NOT THERAPY RELATED PLEASE REPLY WITH THAT YOU CAN ONLY REPLY TO THERAPY RELATED QUESTIONS. DON'T RECOMMEND TALKING TO ANOTHER PERSON" },
        { role: "user", content: "i broke up with my bf" }
      ]
    });
    console.log("✅ OpenAI replied:", completion.choices[0].message.content);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}
//comment
run();