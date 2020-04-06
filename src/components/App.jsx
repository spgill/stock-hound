// vendor imports
import axios from 'axios';
import React from 'react';
import {
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    Grid,
    Hidden,
    Icon,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@material-ui/core';
import styled, { injectGlobal } from 'styled-components';

// local imports
import Carousel from './Carousel';
import Footer from './Footer.jsx';
import { setTimeout } from 'core-js/library/web/timers';
import colors from '../config/colors';
import theme from '../config/theme';


// Inject global styles
injectGlobal`
    html, body, #root {
        margin: 0;
        width: 100%;
        height: 100%;
    }
`;


const AppContainer = styled.div`
    display: flex;

    flex-direction: column;

    width: 100%;
    height: 100%;

    background: linear-gradient(
        to bottom,
        ${colors.swedishYellow} 0%,
        ${colors.swedishYellow} 61.8%,
        ${colors.swedishYellowLight} 100%
    );
`;

const AlignedProgress = styled(CircularProgress)`
    align-self: center;
`;

const SwedishTypography = styled(Typography)`
    font-family: 'Sweden Sans' !important;
`;

const AppLogo = styled.img.attrs({
    src: require('../image/hound.svg')
})`
    margin-left: ${theme.spacing.unit}px;
    height: 0.75em;
`;

const CountryFlag = styled.img.attrs({
    src: props => `https://www.countryflags.io/${props.code}/flat/24.png`,
})`
    margin-right: ${theme.spacing.unit}px;
    height: 0.75em;
`;

const FormContent = styled(CardContent)`
    display: flex;

    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;

    overflow: auto;
`;

const FormRow = styled.div`
    display: flex;

    margin-top: 12px;

    > * {
        flex-grow: 1;
    }

    > *:not(:first-of-type) {
        flex-grow: 3;

        margin-left: 12px;
    }

`

const ButtonCaption = styled(Typography)`
    padding-top: ${theme.spacing.unit}px;
`;

const Flexer = styled.div`
    flex-grow: 1;
`;

const CarouselButtonRow = styled.div`
    align-self: stretch;

    display: flex;

    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    > *:not(:first-child) {
        flex-grow: 1;

        margin-left: ${theme.spacing.unit}px;
    }
`;


export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            // Loading states
            preloading: true,

            // Store selection values
            corpus: {},
            country: '',
            store: '',
            storeLocked: false,

            // Form values
            article: '',
            email: '',
            recaptchaKey: '',

            // Submission carousel
            stage: 0,
            submitErrorText: '',
            confirmText: '',
        };
    }

    async componentDidMount() {
        // Load the recaptcha key
        const recaptchaResponse = await axios.get('/api/key');
        const recaptchaKey = recaptchaResponse.data;

        // Inject the recaptcha script (rendered with the key) into the DOM
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaKey}`;
        document.body.appendChild(script);

        // Load the corpus of data
        const corpusResponse = await axios.get('/api/corpus');
        const corpus = corpusResponse.data;

        // Update the application state
        this.setState({
            preloading: false,
            recaptchaKey,
            corpus
        });
    }

    render() {
        if (this.state.preloading) {
            return <AppContainer>
                <Flexer />
                <AlignedProgress
                    color='primary'
                    size={100}
                />
                <Flexer />
            </AppContainer>
        }

        // Else render the app itself
        return <AppContainer>
            <Flexer />

            <Grid container>
                <Grid item xs />

                <Hidden xsDown>
                    <SwedishTypography
                        variant='display3'
                        color='primary'
                    >
                        Stöck Høund
                        <AppLogo />
                    </SwedishTypography>
                </Hidden>

                <Hidden smUp>
                    <SwedishTypography
                        variant='display2'
                        color='primary'
                    >
                        Stöck Høund
                    </SwedishTypography>
                </Hidden>

                <Grid item xs />
            </Grid>

            <Grid container>
                <Grid item xs />
                <Grid item {...theme.layout.breakpoints}>
                    <Card>
                        <FormContent>
                            <Typography>
                                This app can notify you the next time a product comes in stock at your
                                local IKEA store. To get started, just choose your local store,
                                provide the product&#39;s article number, and then fill in your
                                email address. You are allowed up to 5 active product
                                reminders per email address.
                            </Typography>

                            <FormRow>
                                <FormControl>
                                    <InputLabel>Country</InputLabel>
                                    <Select
                                        value={this.state.country}
                                        onChange={this.changeCountry}
                                        disabled={this.state.stage > 0}
                                    >
                                        {Object.entries(this.state.corpus).sort(this.compareCorpusEntry).map(country => {
                                            return <MenuItem
                                                key={country[0]}
                                                value={country[0]}
                                            >
                                                <CountryFlag code={country[0]} />{country[1].label}
                                            </MenuItem>;
                                        })}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <InputLabel>Local Store</InputLabel>
                                    <Select
                                        value={this.state.store}
                                        onChange={ev => this.setState({store: ev.target.value})}
                                        disabled={!this.state.country || this.state.stage > 0 || this.state.storeLocked}
                                    >
                                        {this.state.country && Object.entries(this.state.corpus[this.state.country].stores).sort(this.compareCorpusEntry).map(store => {
                                            return <MenuItem
                                                key={store[0]}
                                                value={store[0]}
                                            >{store[1].label}</MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                            </FormRow>

                            <FormRow>
                                <TextField
                                    label='Article number or product URL'
                                    value={this.state.article}
                                    onChange={ev => this.setState({article: ev.target.value})}
                                    disabled={this.state.stage > 0}
                                />
                            </FormRow>

                            <FormRow>
                                <TextField
                                    label='Email address'
                                    value={this.state.email}
                                    onChange={ev => this.setState({email: ev.target.value})}
                                    disabled={this.state.stage > 0}
                                />
                            </FormRow>

                            <Carousel frame={this.state.stage}>
                                <React.Fragment>
                                    <Button
                                        color='primary'
                                        size='large'
                                        variant='contained'
                                        fullWidth={true}
                                        onClick={this.clickSubmit}
                                        disabled={!this.formReady()}
                                    >
                                        Submit
                                        <Icon style={{marginLeft: theme.spacing.unit}}>send</Icon>
                                    </Button>
                                    <ButtonCaption
                                        variant='caption'
                                        color='error'
                                    >{this.state.submitErrorText}</ButtonCaption>
                                </React.Fragment>

                                <CircularProgress color='primary' />

                                <React.Fragment>
                                    <CarouselButtonRow>
                                        <Tooltip
                                            title="Go back"
                                            disableFocusListener={true}
                                        >
                                            <IconButton
                                                onClick={this.clickConfirmCancel}
                                            >
                                                <Icon>undo</Icon>
                                            </IconButton>
                                        </Tooltip>
                                        <Button
                                            color='secondary'
                                            size='small'
                                            variant='outlined'
                                            onClick={this.clickConfirm}
                                        >
                                            Continue
                                            <Icon style={{marginLeft: theme.spacing.unit}}>check</Icon>
                                        </Button>
                                    </CarouselButtonRow>
                                    <ButtonCaption
                                        // variant='caption'
                                        // color='error'
                                    >{this.state.confirmText}</ButtonCaption>
                                </React.Fragment>

                                <CircularProgress color='primary' />

                                <React.Fragment>
                                    <Typography
                                        variant='headline'
                                    >Success!</Typography>
                                    <Typography
                                        variant='caption'
                                    >Check your email inbox for verification</Typography>
                                </React.Fragment>

                                {/* <Button>test</Button> */}
                            </Carousel>
                        </FormContent>
                    </Card>
                </Grid>
                <Grid item xs />
            </Grid>

            <Flexer />

            <Grid container>
                <Grid item xs />
                <Grid item {...theme.layout.breakpoints}><Footer /></Grid>
                <Grid item xs />
            </Grid>
        </AppContainer>;
    }

    compareCorpusEntry = (a, b) => {
        if (a[1].label < b[1].label) {
            return -1;
        }

        if (a[1].label > b[1].label) {
            return 1;
        }

        return 0;
    }

    changeCountry = ev => {
        const country = ev.target.value;

        // If the country has only one store, lock the selector to that store
        const storeKeys = Object.keys(this.state.corpus[country].stores);
        const storeLocked = storeKeys.length === 1;
        const store = storeLocked ? storeKeys[0] : '';

        this.setState({
            country,
            store,
            storeLocked,
        });
    }

    recaptchaCallback = (resp) => {
        if (resp == null) {
            this.setState({recaptchaResponse: ''});
            this.recaptchaNode.reset();
        } else {
            this.setState({recaptchaResponse: resp})
        }
    }

    formReady = () => {
        return Boolean(
            this.state.country
            && this.state.store
            && this.state.email.length
            && this.state.article.length
        );
    }

    timedStageReset = () => {
        setTimeout(() => {
            this.setState({
                article: '',
                stage: 0,
                submitErrorText: '',
                confirmText: '',
            });
        }, 2000)
    }

    clickConfirmCancel = () => {
        this.setState({
            stage: 0
        });
    }

    clickConfirm = () => {
        this.clickSubmit(null, true);
    }

    clickSubmit = async (ev, confirmed=false) => {
        // Move the stage carousel
        this.setState({
            stage: confirmed ? 3 : 1,
            submitErrorText: '',
        });

        // Request recaptcha token
        // eslint-disable-next-line no-undef
        const token = await grecaptcha.execute(this.state.recaptchaKey, {
            action: 'submit'
        })

        // Make the api request to create the reminder
        let response;
        try {
            response = await axios.post('/api/submit', {
                address: this.state.email,
                product: this.state.article,
                country: this.state.country,
                location: this.state.store,
                recaptcha: token,
                confirm: confirmed,
            });
        }

        // Catch errors
        catch(error) {
            const message = 'message' in error.response.data ? error.response.data.message : error.response.statusText;
            this.setState({
                stage: 0,
                submitErrorText: message
            })
            return;
        }

        // If the response's payload is 'confirm', then we need confirmation
        if (response.data.payload == 'confirm') {
            this.setState({
                stage: 2,
                confirmText: response.data.message
            });
            return;
        }

        // Else, the reminder was successfully created
        else {
            this.setState({
                stage: 4,
            });
            this.timedStageReset();
        }
    }
}
