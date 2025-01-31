import { Box, Flex, Image, Paper } from "@mantine/core";
import { SlideNode } from "@/components/Result/Flow/SlideNode";
import { FlowArrow } from "@/components/Result/Flow/FlowArrow";
import { FlowHeading } from "@/components/Result/Flow/FlowHeading";

export const Flow = ({ heatmapFlow }) => {
  const {
    slide_heatmap: { slides },
  } = heatmapFlow;
  console.log(slides);

  return (
    <Box mb={"xl"} p={16}>
      <FlowHeading />

      <Box>
        <Image src={"/assets/images/sample02.jpg"} />
      </Box>

      <Box style={{ overflowX: "auto" }}>
        <Flex align="center" pb="md" style={{ minWidth: "max-content" }}>
          {slides.map((slide, index) => (
            // <Box>
            <>
              <SlideNode data={slide} index={index} />
              <FlowArrow />
            </>
            // </Box>
          ))}
        </Flex>
      </Box>
    </Box>
  );
};
