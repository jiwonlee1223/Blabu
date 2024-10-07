import { Server as SocketIOServer } from "socket.io";
import OpenAI from "openai";
import { convertTextToTTS } from "./tts.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use the API key from the .env file
});


const convertObjectToString = (jsonObject) => {
  const convert = (obj) => {
    return Object.entries(obj)
      .map(([key, value]) => {
        if (
          typeof value === "object" &&
          !Array.isArray(value) &&
          value !== null
        ) {
          return convert(value); // 중첩된 객체에 대해 재귀적으로 처리
        } else {
          return `(${key}:${value})`; // 중첩되지 않은 키-값 쌍 변환
        }
      })
      .join("/");
  };

  return convert(jsonObject);
};

const convertJsonToString = (jsonInput1, jsonInput3) => {
  const jsonObject1 = JSON.parse(jsonInput1); // JSON 파싱 시도
  const jsonObject3 = JSON.parse(jsonInput3); // JSON 파싱 시도

  const result1 = convertObjectToString(jsonObject1);
  const result3 = convertObjectToString(jsonObject3);

  return { result1, result3 };
};

// 랜덤하게 4개의 키-값 쌍을 선택하는 함수
const getRandomPairs = (str, count = 4) => {
  const pairs = str.split("/");
  const shuffled = pairs.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).join("/");
};

export function handleSocket(server, port) {
  const io = new SocketIOServer(server);

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("sendPersona", (data) => {
      console.log("Received Persona Setting Text: " + data.text);
      socket.personaText = data.text; // 소켓 세션에 텍스트 저장함 -> displayText에서 쓸 변수로 사용
    });

    socket.on("sendText", async (data) => {
      console.log("Input text: ", data.text);

      const personaText =
        socket.personaText || "낙천적, 친절한 성격의 또래 친구";
      const displayText =
        "#페르소나: [" +
        personaText +
        "]\n" +
        "#참고 데이터: [" +
        data.text +
        "]\n" +
        "#입력: [페르소나]와 [참고 데이터]를 기반으로 차량에 탑승 중인 운전자 및 동승자에게 4문장 내외의 말을 걸어주세요.\n" +
        "#제약조건: 주어진 [페르소나], [참고 데이터], [입력]을 제외한 내용은 포함하지 말 것.\n 차량 충돌이나 모션 감지 정보 전달을 우선시 할 것.";

      const completion = await openai.chat.completions.create({
        messages: [{ role: "assistant", content: displayText }],
        model: "gpt-4-turbo",
      });

      const responseText = completion.choices[0].message.content;

      // TTS 변환 후 클라이언트로 전송
      convertTextToTTS(responseText, (fileName) => {
        socket.emit("responseText", {
          responseText: responseText,
          ttsUrl: `http://localhost:${port}/tts/${fileName}`,
        });
        console.log("Prompt: \n" + displayText);
        console.log("Response Text: ", responseText);
      });
    });

    socket.on("convertJson", async (data) => {
      const { textInput1, textInput3 } = data;

      try {
        const { result1, result3 } = convertJsonToString(
          textInput1,
          textInput3
        );
        const randomResult1 = getRandomPairs(result1);
        const randomResult3 = getRandomPairs(result3);
        socket.emit("conversionResult", {
          result1: randomResult1,
          result3: randomResult3,
        });
      } catch (e) {
        console.log("Invalid JSON input. Falling back to OpenAI API.");

        const text = textInput1 + " " + textInput3;
        const personaText =
          socket.personaText || "낙천적, 친절한 성격의 또래 친구";
        const displayText =
          "#페르소나: [" +
          personaText +
          "]\n" +
          "#참고 데이터: [" +
          text +
          "]\n" +
          "#입력: [페르소나]와 [참고 데이터]를 기반으로 차량에 탑승 중인 운전자에게 4문장 내외의 말을 걸어주세요." +
          "#제약조건: 주어진 [페르소나], [참고 데이터], [입력]을 제외한 내용은 포함하지 말 것.\n 차량 충돌이나 모션 감지 정보 전달을 우선시 할 것." +
          "[주행 종료, 시동을 끄는 상황]이 입력된 경우, 운전을 멈추고 주차를 완료한 상태임.";

        const completion = await openai.chat.completions.create({
          messages: [{ role: "assistant", content: displayText }],
          model: "gpt-4-turbo",
        });

        socket.emit("responseText", {
          responseText: completion.choices[0].message.content,
        });
        console.log("Prompt: \n" + displayText);
        console.log("Response Text: ", completion.choices[0].message.content);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
}

export default (req, res) => {
  res.send("Hello from requestHandler!");
};
