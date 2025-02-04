import { Card, Modal, Divider } from "@mantine/core";

import { SlideImage } from "@/components/Result/Flow/Detail/SlideImage";
import { SlideInfo } from "@/components/Result/Flow/Detail/SlideInfo";
import { SlidePrerequisite } from "@/components/Result/Flow/Detail/SlidePrerequisite";
import { TransitionInfo } from "@/components/Result/Flow/Detail/TransitionInfo";
import { TransitionTarget } from "@/components/Result/Flow/Detail/TransitionTarget";

export const FlowDialog = ({
  displayType,
  opened,
  close,
  edge,
  slide,
  targetSlideObj,
  targetIndex,
}) => {
  const handleCloseDialog = () => {
    close();
  };

  return (
    <Modal
      opened={opened}
      withCloseButton
      onClose={handleCloseDialog}
      size="xl"
      radius="md"
      styles={{
        body: {
          padding: "32px 32px",
          background: "#f8f9fa",
        },
      }}
    >
      <Card mih={480} p={0}>
        {displayType === "slide" ? (
          <>
            <SlideImage targetIndex={targetIndex} />
            <SlideInfo slide={slide} i={targetIndex} />
            {/* <Divider /> */}

            {targetSlideObj && (
              <SlidePrerequisite
                targetSlideObj={targetSlideObj}
                index={targetIndex}
              />
            )}
          </>
        ) : (
          <>
            <TransitionTarget targetEdge={edge} />
            <TransitionInfo issues={edge.transition_issues} />
          </>
        )}
      </Card>
    </Modal>
  );
};
