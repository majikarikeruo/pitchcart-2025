import { useState } from "react";
import { Box, Flex, List, Text, Paper } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { SlideNode } from "@/components/features/Result/Flow/Timeline/SlideNode";
import { TransitionArrow } from "@/components/features/Result/Flow/Timeline/TransitionArrow";
import { FlowHeading } from "@/components/features/Result/Flow/FlowHeading";
import { FlowDialog } from "@/components/features/Result/Flow/Detail/FlowDialog";

import {
  HeatmapData,
  structureData,
  prerequisiteData,
  DisplayType,
  SectionType,
  SECTION_CONFIG,
  PrerequisiteCheckItemProps,
  narrativeSectionsProps,
} from "@/types/Result";

interface FlowProps {
  heatmapFlow: HeatmapData;
  structureFlow: structureData;
  prerequisiteCheck: prerequisiteData;
}

const getSectionInfo = (type: string) => {
  const defaultSection = {
    color: "#228BE6",
    label: type,
  };

  return SECTION_CONFIG[type as SectionType] || defaultSection;
};

export const Flow = ({
  heatmapFlow,
  structureFlow,
  prerequisiteCheck,
}: FlowProps) => {
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [displayType, setDisplayType] = useState<DisplayType>("slide");
  const [opened, { toggle, close }] = useDisclosure(false);
  const [targetSlideObj, setTargetSlideObj] = useState<
    PrerequisiteCheckItemProps | undefined
  >(undefined);

  const {
    slide_heatmap: { slides },
  } = heatmapFlow;

  const {
    structure_flow: { story_structure, edges },
  } = structureFlow;

  const {
    prerequisite_check: { missing_prerequisites },
  } = prerequisiteCheck;

  const slideIndexes = Array.from(
    { length: slides.length * 2 - 1 },
    (_, index) => index
  );

  /**
   * スライド部分をクリックした時の挙動
   * @param {Number}index
   */
  const handleClickSlide = (index: number) => {
    setTargetIndex(index);
    const targetObj = missing_prerequisites.find(
      (item: PrerequisiteCheckItemProps) => {
        return item.slide_number === index + 1;
      }
    );
    setTargetSlideObj(targetObj);
  };

  return (
    <Paper mb={"xl"} p={40} px={24} shadow="md">
      <FlowHeading />
      <FlowDialog
        displayType={displayType}
        opened={opened}
        close={close}
        edge={edges[targetIndex]}
        slide={slides[targetIndex]}
        targetSlideObj={targetSlideObj}
        targetIndex={targetIndex}
      />

      {/* Flow部分 */}
      <Box style={{ overflowX: "auto" }} mt={24}>
        <Flex mb={24}>
          {story_structure?.narrative_sections.map(
            (story: narrativeSectionsProps, index: number) => {
              const range = story.slide_range.end - story.slide_range.start + 1;
              const { color, label } = getSectionInfo(story.type);
              const isLast =
                index === story_structure.narrative_sections.length - 1;

              return [
                <Box
                  miw={244 * range}
                  key={index}
                  bg={color}
                  p={12}
                  c={"#fff"}
                  style={{
                    background: color,
                    position: "relative",
                    transition: "all 0.3s ease",
                    ...(!isLast && {
                      clipPath: `polygon(
                      0 0,
                      calc(100% - 24px) 0,
                      100% 50%,
                      calc(100% - 24px) 100%,
                      0 100%
                    )`,
                    }),
                  }}
                >
                  <Text fz={16} fw={"bold"} mb={8}>
                    {label}
                  </Text>

                  {story.key_messages.map((item, i) => (
                    <List withPadding key={i}>
                      <List.Item fz={15}>{item}</List.Item>
                    </List>
                  ))}
                </Box>,
              ];
            }
          )}
        </Flex>

        <Flex align="center" pb="md" style={{ minWidth: "max-content" }}>
          {slideIndexes.map((i: number) => {
            const isSlide = i % 2 === 0;
            const slideIndex = Math.floor(i / 2);
            console.log(edges, slideIndex);

            return isSlide ? (
              <SlideNode
                key={i}
                toggle={toggle}
                data={slides[slideIndex]}
                index={slideIndex}
                handleClickSlide={() => {
                  setDisplayType("slide");
                  handleClickSlide(slideIndex);
                }}
              />
            ) : (
              <TransitionArrow
                key={i}
                hasIssue={
                  edges[slideIndex] &&
                  edges[slideIndex].transition_issues.length > 0
                }
                onClick={() => {
                  toggle();
                  setDisplayType("transition");
                  handleClickSlide(slideIndex);
                }}
              />
            );
          })}
        </Flex>
      </Box>
    </Paper>
  );
};
