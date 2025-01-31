import {
  Pill,
  Grid,
  Timeline,
  Stack,
  Title,
  Text,
  Box,
  Flex,
  ThemeIcon,
  Modal,
  Button,
} from "@mantine/core";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

export const Improvement = ({ text5 }) => {
  const [opened, setOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const {
    improvements: { slide_specific },
  } = text5;
  console.log(slide_specific);

  const items = slide_specific;

  // [
  //   {
  //     value: "1",
  //     title: (
  //       <Pill
  //         defaultChecked
  //         styles={{
  //           root: {
  //             backgroundColor: "#f8d7da",
  //             borderRadius: 8,
  //             color: "#b91c1c",
  //             fontSize: 12,
  //           },
  //         }}
  //       >
  //         優先度・高
  //       </Pill>
  //     ),
  //     icon: <AlertCircle style={{ marginRight: 8 }} color="red" size={80} />,
  //     description: (
  //       <>
  //         <Title order={5} mt={16}>
  //           競合分析を明示する
  //         </Title>
  //         <Timeline
  //           bulletSize={24}
  //           lineWidth={2}
  //           p={16}
  //           ml={16}
  //           styles={{ itemTitle: { fontWeight: 700, marginBottom: 16 } }}
  //         >
  //           <Timeline.Item title="現状" fw={500}>
  //             <Text mb={12} fz={14} mt={8}>
  //               競合との違いが不明瞭
  //             </Text>
  //             <Text mb={12} fz={14} mt={8}>
  //               競合優位性が伝わりにくい
  //             </Text>
  //             <Text mb={12} fz={14} mt={8}>
  //               投資家の信頼を得られない可能性がある
  //             </Text>
  //           </Timeline.Item>
  //           <Timeline.Item title="改善案">
  //             <Text mb={12} fz={14} mt={8}>
  //               競合調査を行う (2週間)
  //             </Text>
  //             <Text mb={12} fz={14} mt={8}>
  //               競合との差別化ポイントをスライドに追加 (3日)
  //             </Text>
  //           </Timeline.Item>
  //           <Timeline.Item title="期待される結果">
  //             <Text mb={12} fz={14} mt={8}>
  //               投資家からの信頼度が向上
  //             </Text>
  //             <Text mb={12} fz={14} mt={8}>
  //               市場での位置づけが明確になる
  //             </Text>
  //             <Text mb={12} fz={14} mt={8}>
  //               投資家からの信頼度が15%向上
  //             </Text>
  //           </Timeline.Item>
  //         </Timeline>
  //       </>
  //     ),
  //   },
  // ];

  return (
    <Stack my={100}>
      <Flex direction="column-reverse" gap="xs">
        <Title order={2} fz={40} mb="lg" c="#228be6">
          改善提案
        </Title>
        <Text size="sm" c="#228be6" fw={700} tt="uppercase">
          Improvement
        </Text>
      </Flex>

      <Grid>
        {items.map((item) => (
          <Grid.Col span={4} key={item.value}>
            <Box
              bg={"white"}
              p={16}
              style={{ border: "1px solid #E9ECEF" }}
              pos="relative"
            >
              <ThemeIcon size={80} radius="xl" variant="white" color="#228be6">
                {item.icon}
              </ThemeIcon>
              <Text size="sm" c="#228be6" fw={700} tt="uppercase">
                {item.title}{" "}
              </Text>

              <Title order={4} mt={16}>
                {item.description.props.children[0].props.children}
              </Title>
              <Button
                variant="light"
                color="blue"
                fullWidth
                mt="md"
                onClick={() => {
                  setSelectedItem(item);
                  setOpened(true);
                }}
              >
                詳細を見る
              </Button>
            </Box>
          </Grid.Col>
        ))}
      </Grid>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={selectedItem?.description.props.children[0]}
        size="lg"
      >
        {selectedItem?.description.props.children[1]}
      </Modal>
    </Stack>
  );
};
