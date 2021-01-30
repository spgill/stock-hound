// vendor imports
import axios from "axios";
import React from "react";
import styled from "styled-components";
import {
  Grommet,
  Main,
  Box,
  Button,
  Heading,
  Paragraph,
  Select,
  TextInput,
} from "grommet";
import {
  BounceLoader as Loader,
  BarLoader as SubmitLoader,
} from "react-spinners";

// local imports
// import Carousel from "./Carousel";
import { Footer } from "./Footer.jsx";
import colors from "../config/colors";
// import theme from "../config/theme";
import { appTheme } from "../config/theme";

// Asset imports
import { ReactComponent as HoundLogoSVG } from "../assets/images/hound.svg";

const LOCALSTORAGE = Object.freeze({
  COUNTRY: "storeCountry",
  LOCATION: "storeLocation",
  EMAIL: "emailAddress",
});

const MainGrid = styled(Main)`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: 1fr auto 1fr;
  grid-template-areas:
    ". header ."
    ". body ."
    "footer footer footer";
  grid-gap: ${(props) => props.theme.global.edgeSize[props.pad ?? "small"]};
  justify-items: center;
  align-items: end;

  background: linear-gradient(
    to bottom,
    ${colors.swedishYellow} 0%,
    ${colors.swedishYellow} 61.8%,
    ${colors.swedishYellowLight} 100%
  );
`;

const StyledHeader = styled(Heading)`
  grid-area: header;

  font-family: "Sweden Sans";

  > svg {
    height: 1em;
    fill: ${(props) => props.theme.global.colors.brand};
  }
`;

const StyledBody = styled(Box)`
  grid-area: body;
`;

const StyledLoaderContainer = styled.div`
  grid-area: body;

  display: flex;
  justify-content: center;
  align-items: center;

  width: 128px;
  height: 128px;
`;

const StyledLoader = styled(Loader).attrs((props) => ({
  color: props.theme.global.colors["accent-1"],
}))``;

const StyledSubmitLoader = styled(SubmitLoader).attrs((props) => ({
  color: props.theme.global.colors["accent-1"],
}))``;

const StyledFooter = styled(Box)`
  grid-area: footer;
`;

const StyledFormStage = styled.div`
  display: grid;

  grid-template-columns: 1rem auto;
  grid-gap: ${(props) => props.theme.global.edgeSize.small};
  /* justify-items: start; */
  align-items: start;

  margin-top: ${(props) => props.theme.global.edgeSize[props.margin ?? "none"]};

  > span {
    justify-self: end;

    color: ${(props) => props.theme.global.colors["dark-4"]};

    user-select: none;
  }
`;

const BoxFlexChildren = styled(Box)`
  > * {
    flex: 1;
  }

  > *:last-child:not(:first-child) {
    flex: 0.618;

    margin-left: ${(props) => props.theme.global.edgeSize.small};
  }
`;

function FormStage(props) {
  return (
    <StyledFormStage margin={props.margin}>
      <span>{props.stage}.</span>
      {props.children}
    </StyledFormStage>
  );
}

export default function App() {
  // Loading state
  const [isPreloading, setIsPreloading] = React.useState(true);
  const [recaptchaKey, setRecaptchaKey] = React.useState("");
  const [corpusData, setCorpusData] = React.useState({});

  // Store selection state
  const [storeCountry, setStoreCountry] = React.useState(
    window.localStorage.getItem(LOCALSTORAGE.COUNTRY)
  );
  const [storeLocation, setStoreLocation] = React.useState(
    window.localStorage.getItem(LOCALSTORAGE.LOCATION)
  );
  const [storeLocationLocked, setStoreLocationLocked] = React.useState(false);

  // Form state
  const [articleNumber, setArticleNumber] = React.useState("");
  const [emailAddress, setEmailAddress] = React.useState(
    window.localStorage.getItem(LOCALSTORAGE.EMAIL)
  );

  // Submission state
  const [submissionError, setSubmissionError] = React.useState("");
  const [confirmationRequired, setConfirmationRequired] = React.useState(false);
  const [submissionLoading, setSubmissionLoading] = React.useState(false);
  const [submissionSucceeded, setSubmissionSucceeded] = React.useState(false);
  const successTimer = React.useRef(null);

  // On app load, fetch necessary data from server
  const fetchServerData = React.useCallback(async () => {
    // Load the recaptcha key
    const recaptchaResponse = await axios.get("/api/key");
    setRecaptchaKey(recaptchaResponse.data);

    // Inject the recaptcha script (rendered with the key) into the DOM
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaResponse.data}`;
    document.body.appendChild(script);

    // Load the store corpus and sort by label
    const corpusResponse = await axios.get("/api/corpus");
    setCorpusData(corpusResponse.data);

    // Deactivate the preloader
    setIsPreloading(false);
  }, []);
  React.useEffect(() => {
    fetchServerData();
  }, []);

  // Process the corpus data into props for the selection component
  const storeCountryOptions = React.useMemo(
    () =>
      Object.entries(corpusData)
        .sort((a, b) => a[1].label.localeCompare(b[1].label))
        .map((e) => e[0]),
    [corpusData]
  );
  const getStoreCountryLabel = React.useCallback(
    (key) => corpusData[key].label,
    [corpusData]
  );

  // Event handler for changing store country selection.
  // Wipes the location ONLY IF the country actually changes
  const handleStoreCountryChange = React.useCallback((event) => {
    setStoreCountry(event.option);
    window.localStorage.setItem(LOCALSTORAGE.COUNTRY, event.option);
  }, []);

  // Process store country selection into options for the location selection component
  const storeLocationOptions = React.useMemo(
    () =>
      Object.entries(corpusData[storeCountry]?.stores ?? {})
        .sort((a, b) => a[1].label.localeCompare(b[1].label))
        .map((e) => e[0]),
    [corpusData, storeCountry]
  );
  const getStoreLocationLabel = React.useCallback(
    (key) => corpusData[storeCountry]?.stores?.[key]?.label ?? "",
    [corpusData, storeCountry]
  );

  // Evaluate on update of store location options
  React.useEffect(() => {
    if (storeLocationOptions.length) {
      // If there is one or fewer options, lock the selection component
      setStoreLocationLocked(storeLocationOptions.length <= 1);

      // If there is one option, pre-select it
      if (storeLocationOptions.length === 1) {
        setStoreLocation(storeLocationOptions[0]);
      }
      // Else, check if the currect option is valid. If not, reset it to blank.
      else {
        setStoreLocation((currentSel) =>
          storeLocationOptions.includes(currentSel) ? currentSel : ""
        );
      }
    }
  }, [storeLocationOptions]);

  // Event handler for changing store location selection
  const handleStoreLocationChange = React.useCallback((event) => {
    setStoreLocation(event.option);
    window.localStorage.setItem(LOCALSTORAGE.LOCATION, event.option);
  }, []);

  // Even handlers for text input components
  const handleArticleNumberChange = React.useCallback((event) =>
    setArticleNumber(event.target.value)
  );
  const handleEmailAddressChange = React.useCallback((event) => {
    setEmailAddress(event.target.value);
    window.localStorage.setItem(LOCALSTORAGE.EMAIL, event.target.value);
  });

  // Evaluate if the submit button should be disabled
  const submitDisabled =
    !storeCountry || !storeLocation || !articleNumber || !emailAddress;

  // Event handler for clicking submit
  const handleSubmitClick = React.useCallback(async () => {
    setSubmissionLoading(true);

    // Clear any submission messages first
    setSubmissionError("");
    clearTimeout(successTimer.current);
    setSubmissionSucceeded(false);

    // Request recaptcha token
    let token;
    try {
      // eslint-disable-next-line no-undef
      token = await grecaptcha.execute(recaptchaKey, {
        action: "submit",
      });
    } catch (error) {
      console.error(error);
      setSubmissionError("ReCAPTCHA error. Reload page and try again.");
      setSubmissionLoading(false);
      return;
    }

    // Make the api request to create the reminder
    let response;
    try {
      response = await axios.post("/api/submit", {
        address: emailAddress,
        product: articleNumber,
        country: storeCountry,
        location: storeLocation,
        recaptcha: token,
        confirm: confirmationRequired,
      });
    } catch (error) {
      console.error(error);
      setSubmissionError(
        error.response?.data?.message ??
          error.response?.statusText ??
          "Unknown request error"
      );
      setSubmissionLoading(false);
      return;
    }

    // If the response's payload is 'confirm', then we need confirmation
    if (response.data.payload == "confirm") {
      setSubmissionError(response.data.message);
      setConfirmationRequired(true);
      setSubmissionLoading(false);
      return;
    }

    // Finally, clean up the state
    setSubmissionError("");
    setConfirmationRequired(false);
    setArticleNumber("");
    setSubmissionSucceeded(true);
    setSubmissionLoading(false);

    // After a few seconds, wipe the success message
    successTimer.current = setTimeout(
      () => setSubmissionSucceeded(false),
      5000
    );
  }, [
    recaptchaKey,
    emailAddress,
    articleNumber,
    storeCountry,
    storeLocation,
    confirmationRequired,
  ]);

  // Event handler for clicking cancel on confirmation prompt
  const handleCancelClick = React.useCallback(() => {
    setSubmissionError("");
    setConfirmationRequired(false);
  }, []);

  return (
    <Grommet full theme={appTheme}>
      <MainGrid pad="small">
        {isPreloading ? (
          <StyledLoaderContainer>
            <StyledLoader color={colors.swedishBlue} />
          </StyledLoaderContainer>
        ) : (
          <>
            {/* HEADER */}
            <StyledHeader margin="none" color="brand">
              Stöck Høund <HoundLogoSVG />
            </StyledHeader>

            {/* BODY */}
            <StyledBody
              pad="medium"
              background="light-1"
              elevation="small"
              align="stretch"
              round
            >
              <Paragraph margin={{ top: "none", bottom: "medium" }}>
                This app will notify you the next time a product of your choice
                comes in stock at your local IKEA store. You are allowed up to 5
                active product reminders per email address.
              </Paragraph>

              <FormStage stage={1}>
                <Select
                  placeholder="Country"
                  options={storeCountryOptions}
                  value={storeCountry}
                  labelKey={getStoreCountryLabel}
                  onChange={handleStoreCountryChange}
                  disabled={submissionLoading || confirmationRequired}
                />
              </FormStage>

              <FormStage stage={2} margin="xsmall">
                <Select
                  placeholder="Store"
                  options={storeLocationOptions}
                  value={storeLocation}
                  labelKey={getStoreLocationLabel}
                  onChange={handleStoreLocationChange}
                  disabled={
                    submissionLoading ||
                    confirmationRequired ||
                    storeLocationLocked
                  }
                />
              </FormStage>

              <FormStage stage={3} margin="xsmall">
                <TextInput
                  placeholder="Email address"
                  value={emailAddress}
                  onChange={handleEmailAddressChange}
                  disabled={
                    submissionLoading || confirmationRequired || !storeLocation
                  }
                />
              </FormStage>

              <FormStage stage={4} margin="xsmall">
                <TextInput
                  placeholder="Article number or product URL"
                  value={articleNumber}
                  onChange={handleArticleNumberChange}
                  disabled={
                    submissionLoading || confirmationRequired || !storeLocation
                  }
                />
              </FormStage>

              {submissionLoading ? (
                <StyledSubmitLoader
                  css={{ margin: "calc(16px + 24px) auto 16px auto" }}
                />
              ) : (
                <BoxFlexChildren direction="row" margin={{ top: "medium" }}>
                  <Button
                    primary
                    label={
                      confirmationRequired ? "Continue" : "Create Reminder"
                    }
                    disabled={submissionLoading || submitDisabled}
                    onClick={handleSubmitClick}
                  />
                  {confirmationRequired && (
                    <Button
                      label="Cancel"
                      color="status-critical"
                      onClick={handleCancelClick}
                      disabled={submissionLoading}
                    />
                  )}
                </BoxFlexChildren>
              )}

              {submissionError && (
                <Paragraph
                  color="status-error"
                  margin={{ top: "small", bottom: "none" }}
                >
                  {submissionError}
                </Paragraph>
              )}

              {submissionSucceeded && (
                <Paragraph
                  color="status-ok"
                  margin={{ top: "small", bottom: "none" }}
                >
                  Success! Check your email for confirmation
                </Paragraph>
              )}
            </StyledBody>

            {/* FOOTER */}
            <StyledFooter>
              <Footer />
            </StyledFooter>
          </>
        )}
      </MainGrid>
    </Grommet>
  );
}
