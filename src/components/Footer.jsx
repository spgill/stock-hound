// vendor imports
import { Button, Layer, Text } from "grommet";
import { Favorite } from "grommet-icons";
import React from "react";
import styled from "styled-components";

// local imports
import { RemoteMarkdown } from "./RemoteMarkdown";

// asset imports
import aboutCopy from "../assets/copy/about.md";
import privacyCopy from "../assets/copy/privacy-policy.md";

const DialogLayer = styled(Layer)`
  padding: ${(props) => props.theme.global.edgeSize[props.padding ?? "none"]} 0;
  font-size: ${(props) => props.theme.paragraph.small.size};
  overflow-y: scroll;

  > * {
    margin-left: ${(props) =>
      props.theme.global.edgeSize[props.padding ?? "none"]};
    margin-right: ${(props) =>
      props.theme.global.edgeSize[props.padding ?? "none"]};
  }
`;

// The dialog for the "About this application" button/link
function AboutDialog(props) {
  return (
    props.isOpen && (
      <DialogLayer
        margin="medium"
        padding="medium"
        onEsc={props.onClose}
        onClickOutside={props.onClose}
      >
        <RemoteMarkdown url={aboutCopy} />

        <Button label="Dismiss" onClick={props.onClose} />
      </DialogLayer>
    )
  );
}

// Dialog for the Privacy Policy
function PrivacyDialog(props) {
  return (
    props.isOpen && (
      <DialogLayer
        margin="medium"
        padding="medium"
        onEsc={props.onClose}
        onClickOutside={props.onClose}
      >
        <RemoteMarkdown url={privacyCopy} />

        <Button label="Dismiss" onClick={props.onClose} />
      </DialogLayer>
    )
  );
}

export function Footer() {
  const [aboutDialogOpen, setAboutDialogOpen] = React.useState(false);

  const openAboutDialog = React.useCallback(() => setAboutDialogOpen(true), []);
  const closeAboutDialog = React.useCallback(
    () => setAboutDialogOpen(false),
    []
  );

  const [privacyDialogOpen, setPrivacyDialogOpen] = React.useState(false);

  const openPrivacyDialog = React.useCallback(
    () => setPrivacyDialogOpen(true),
    []
  );
  const closePrivacyDialog = React.useCallback(
    () => setPrivacyDialogOpen(false),
    []
  );

  return (
    <>
      <Text size="xsmall">
        Made with <Favorite size="small" /> in Raleigh, NC.{" "}
        <a href="#" onClick={openAboutDialog}>
          About this application
        </a>
        .
      </Text>

      <Text size="xsmall">
        By using this application, you agree to its{" "}
        <a href="#" onClick={openPrivacyDialog}>
          Privacy Policy
        </a>
        .
      </Text>

      <AboutDialog isOpen={aboutDialogOpen} onClose={closeAboutDialog} />
      <PrivacyDialog isOpen={privacyDialogOpen} onClose={closePrivacyDialog} />
    </>
  );
}
