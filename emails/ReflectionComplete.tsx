import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import * as React from "react";

interface ReflectionCompleteEmailProps {
  smileScore?: number;
  streak?: number;
  nextCheckInTime?: string;
}

export const ReflectionCompleteEmail = ({
  smileScore = 0,
  streak = 0,
  nextCheckInTime = "Tomorrow",
}: ReflectionCompleteEmailProps) => (
  <Html>
    <Head />
    <Preview>✨ +100 Points! Your Aura is glowing.</Preview>
    <Tailwind>
      <Body className="bg-[#050913] my-auto mx-auto font-sans text-[#ffffff]">
        <Container className="border border-solid border-[#333] rounded-[20px] my-[40px] mx-auto p-[40px] max-w-[500px] bg-[#0a0a0a]">
          <Section className="text-center mb-[30px]">
            <Text className="text-[40px] mb-[10px] m-0">✨</Text>
            <Heading className="text-white text-[24px] font-bold m-0 text-center">
              Reflection Complete
            </Heading>
            <Text className="text-[#ffb088] text-[14px] tracking-[2px] uppercase m-0 text-center">
              Aura Atlas Daily Log
            </Text>
          </Section>

          <Section className="bg-[#1a1a1a] rounded-[15px] p-[20px] mb-[20px] text-center border border-solid border-[#ffffff08]">
            <Text className="text-[#888] text-[12px] uppercase m-0 mb-[5px] text-center">
              Current Smile Score
            </Text>
            <Text className="text-white text-[32px] font-bold m-0 text-center">
              {smileScore.toLocaleString()}
            </Text>
          </Section>

          <Section className="bg-[#1a1a1a] rounded-[15px] p-[20px] mb-[30px] text-center border border-solid border-[#ffffff08]">
            <Text className="text-[#888] text-[12px] uppercase m-0 mb-[5px] text-center">
              Wellness Streak
            </Text>
            <Text className="text-[#fb923c] text-[24px] font-bold m-0 text-center">
              🔥 {streak} Days
            </Text>
          </Section>

          <Hr className="border-[#333] my-[30px]" />

          <Section className="text-center">
            <Text className="text-[#888] mb-[10px] m-0 text-center">
              Your next check-in unlocks at:
            </Text>
            <Section className="inline-block bg-[#ffb08820] text-[#ffb088] px-[20px] py-[10px] rounded-[50px] font-bold border border-solid border-[#ffb08850] text-center">
              ⏳ {nextCheckInTime}
            </Section>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default ReflectionCompleteEmail;
