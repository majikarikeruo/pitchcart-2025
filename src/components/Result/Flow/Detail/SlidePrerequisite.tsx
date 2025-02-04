import {
  Title,
  Text,
  Badge,
  Box,
  List,
  ThemeIcon,
  Flex,
  Tabs,
} from "@mantine/core";
import {
  IconZoomCheck,
  IconThumbDown,
  IconRipple,
  IconCheck,
  IconCategory,
} from "@tabler/icons-react";

export const SlidePrerequisite = ({
  targetSlideObj,
  index,
}: {
  targetSlideObj: any;
  index: number;
}) => {
  return (
    <Box key={index} p={24} bg={"white"}>
      <Box ta={"center"}>
        <ThemeIcon mr={12} variant="white" color="#5da9ec">
          <IconZoomCheck />
        </ThemeIcon>
        <Text c="#5da9ec" tt={"uppercase"} fw={"bold"}>
          prerequisiteCheck
        </Text>
        <Title order={3} mb={16} p={8} px={12} ta={"center"}>
          考慮すべき前提条件の抜け漏れ
        </Title>
      </Box>
      <Badge
        fz={14}
        size="xl"
        variant="light"
        radius="xs"
        leftSection={<IconCategory />}
      >
        {targetSlideObj.topic}
      </Badge>
      <Box>
        <Tabs defaultValue={"1"}>
          <Tabs.List>
            <Tabs.Tab value="1" leftSection={<IconThumbDown size={20} />}>
              不足ポイント
            </Tabs.Tab>
            <Tabs.Tab value="2" leftSection={<IconRipple size={20} />}>
              影響
            </Tabs.Tab>
            <Tabs.Tab value="3" leftSection={<IconCheck size={20} />}>
              改善案
            </Tabs.Tab>

            <Tabs.Panel value="1">
              <Box p={24} mb={24} bg={"#f6f6f6"} style={{ borderRadius: 8 }}>
                <Box>
                  <Text mb={16} fz={18} fw={"bold"} c={"#55749c"}>
                    {targetSlideObj.current_state.description}
                  </Text>
                  <Box>
                    <Badge fz={14} size="lg" variant="light" mb={12}>
                      不足要素
                    </Badge>
                    <List withPadding>
                      {targetSlideObj.current_state.missing_elements.map(
                        (item, index) => (
                          <List.Item key={index}>{item}</List.Item>
                        )
                      )}
                    </List>
                  </Box>
                </Box>
              </Box>
            </Tabs.Panel>
            <Tabs.Panel value="2">
              <Box bg={"#f6f6f6"} p={24} mb={24} style={{ borderRadius: 8 }}>
                <Text fz={18} fw={"bold"} c={"#55749c"}>
                  {targetSlideObj.impact.description}
                </Text>
                <Text fz={16} mt={24}>
                  {targetSlideObj.impact.audience_perspective}
                </Text>
              </Box>
            </Tabs.Panel>
            <Tabs.Panel value="3">
              <Box bg={"#f6f6f6"} p={24} mb={24} style={{ borderRadius: 8 }}>
                <Text fz={18} fw={"bold"} c={"#55749c"}>
                  {targetSlideObj.recommendation.what_to_add}
                </Text>
                <Text fz={16} mt={24}>
                  {targetSlideObj.recommendation.why_needed}
                </Text>
              </Box>
            </Tabs.Panel>
          </Tabs.List>
        </Tabs>
      </Box>
    </Box>
  );
};
