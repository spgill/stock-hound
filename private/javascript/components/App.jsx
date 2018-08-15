import axios from 'axios';
import classNames from 'classnames';

// import {
//     Button,
//     Card,
//     Loading,
//     Modal,
//     Select, SelectItem,
//     TextInput,
// } from 'carbon-components-react';
import {
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    Icon,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@material-ui/core';
import Recaptcha from 'react-google-recaptcha';
import styled, { injectGlobal } from 'styled-components';

import Carousel from './Carousel';
import Footer from './Footer.jsx';
import { setTimeout } from 'core-js/library/web/timers';
import colors from '../config/colors';
import theme from '../config/theme';



const randId = () => _.sampleSize('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8).join('')


const noop = () => <div />;

// const Button = noop;
// const Card = noop;
const Loading = noop;
const Modal = noop;
// const Select = noop;
const SelectItem = noop;
const TextInput = noop;


// Inject global styles
injectGlobal`
    html, body, #sh-App {
        margin: 0;
        width: 100%;
        height: 100%;
    }
`;


const AppContainer = styled.div`
    grid-template-columns: auto 0.5fr auto;
    grid-template-rows: auto 128px [hull-start] 0.75fr [hull-end] auto 32px;
    grid-template-areas:
        "spacer-top spacer-top spacer-top"
        ". header ."
        ". hull ."
        "spacer-bottom spacer-bottom spacer-bottom"
        "footer footer footer";
    justify-items: center;
    align-items: center;

    display: grid;
    overflow: hidden;

    width: 100%;
    height: 100%;

    background: linear-gradient(
        to bottom,
        ${colors.swedishYellow} 0%,
        ${colors.swedishYellow} 61.8%,
        ${colors.swedishYellowLight} 100%
    );
`;

const AlignedSpinner = styled.div`
    grid-area: hull;
`;

const AppHeader = styled.div`
    grid-area: header;
    align-self: end;

    flex-direction: row;
    justify-content: center;
    align-items: center;

    display: flex;

    width: 100%;
    height: 100%;

    > h1 {
        margin: 0 12px 0 0;

        font-family: 'Sweden Sans';
        font-size: 40pt;
        white-space: nowrap;
        color: ${colors.swedishBlue};
    }

    > img {
        height: 40pt;
    }
`;

const AppCard = styled(Card)`
    display: flex;

    grid-area: hull;

    width: 100%;
    height: 100%;
`;

const AppFooter = styled.div`
    grid-area: footer;
`;

const CardFormContent = styled(CardContent)`
    display: flex;

    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
`;

const FormRow = styled.div`
    display: flex;

    margin-top: 12px;

    > *:not(:first-of-type) {
        margin-left: 12px;
    }

    > *:last-of-type {
        flex-grow: 1;
    }
`

const TooltipWrapper = styled.div`
    align-self: stretch;
`;

const ButtonCaption = styled(Typography)`
    padding-top: ${theme.spacing.unit}px;
`;

const FakeCaptcha = styled.div`
    margin: ${theme.spacing.unit}px 0;
    width: 304px;
    height: 78px;
`;

const RealCaptcha = styled(Recaptcha)`
    margin: ${theme.spacing.unit}px 0;
    width: 304px;
    height: 78px;
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
            loadingStores: true,
            loadingKey: true,

            // Store selection values
            storeList: null,
            country: 'us',
            store: '',

            // Form values
            article: '',
            email: 'samuel@spgill.me',
            recaptchaKey: '',

            // Submission carousel
            stage: 0,
            submitErrorText: '',
            confirmText: '',
        };
    }

    componentDidMount() {
        // Fetch the list of stores
        axios.get('/stores').then(resp => {
            const newStoreId = Object.keys(resp.data[this.state.country])[0];
            this.setState({
                loadingStores: false,
                storeList: resp.data,
                store: resp.data[this.state.country][newStoreId],
            });
        });

        // Fetch the captcha key
        // axios.get('/key').then(resp => {
        //     this.setState({
        //         loadingKey: false,
        //         recaptchaKey: resp.data,
        //     });
        // });
        axios.get('/key').then(this.recaptchaLoad);
    }

    render() {
        // If loading globally, only render a loading wheel
        // if (this.state.loadingStores || this.state.loadingKey) {
        //     return <Loading withOverlay={false} />;
        // }

        if (this.state.loadingStores || this.state.loadingKey) {
            return <AppContainer>
                <AlignedSpinner
                    intent='primary'
                    size={100}
                />
            </AppContainer>
        }

        // Else render the app itself
        return <AppContainer>
            <AppHeader>
                <h1>Stöck Høund</h1>
                <img src={require('../../image/hound.svg')} />
            </AppHeader>
            <AppCard>
                <CardFormContent>
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
                                <MenuItem value='us'>USA</MenuItem>
                                <MenuItem value='ca'>Canada</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <InputLabel>Local Store</InputLabel>
                            <Select
                                value={this.state.store}
                                onChange={ev => this.setState({store: ev.target.value})}
                                disabled={this.state.stage > 0}
                            >
                                {Object.keys(this.state.storeList[this.state.country]).map(storeName => {
                                    const storeId = this.state.storeList[this.state.country][storeName];
                                    return <MenuItem
                                        key={storeId}
                                        value={storeId}
                                    >{storeName}</MenuItem>;
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

                    <Carousel frame={this.state.stage} style={{flexGrow: '1'}}>
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
                    </Carousel>
                </CardFormContent>
            </AppCard>
            <AppFooter>footer</AppFooter>
        </AppContainer>;
    }

    changeCountry = (ev) => {
        const newCountry = ev.target.value;
        const newStoreId = Object.keys(this.state.storeList[newCountry])[0];

        this.setState({
            country: newCountry,
            store: this.state.storeList[newCountry][newStoreId],
        });
    }

    recaptchaLoad = resp => {
        const key = resp.data;

        // Inject the recaptcha script (rendered with the key) into the DOM
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${key}`;
        document.body.appendChild(script);

        // Update the application state
        this.setState({
            loadingKey: false,
            recaptchaKey: key,
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
        // return true;
        return Boolean(
            this.state.email.length
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
        // If (somehow) they haven't provided everything, show an error
        // if (!this.formReady()) {
        //     this.setState({
        //         modalErrorOpen: true,
        //         modalErrorText: 'You have not filled out all the form fields, or have not completed the recaptcha.'
        //     });
        //     return;
        // }

        // Move the stage carousel
        this.setState({stage: confirmed ? 3 : 1});

        // Request recaptcha token
        const token = await grecaptcha.execute(this.state.recaptchaKey, {
            action: 'submit'
        })

        // Make the api request to create the reminder
        let response;
        try {
            response = await axios.post('/submit', {
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


        // this.setState({
        //     stage: 2,
        //     confirmText: 'You have reached your limit of 5 reminders. If you continue, your oldest reminder will be terminated.'
        // });

        // // On success
        // req.then((resp) => {
        //     // If the response's payload is 'confirm', then we need confirmation
        //     if (resp.data.payload == 'confirm') {
        //         this.setState({
        //             modalConfirmOpen: true,
        //         });
        //     }

        //     // Else, the reminder was successfully created
        //     else {
        //         this.setState({
        //             modalSuccessOpen: true,
        //         });
        //         this.stopLoading();
        //     }
        // });

        // // On failure :(
        // req.catch(err => {
        //     // If this is an api error, then there will be a specific message
        //     const message = 'message' in err.response.data ?
        //         err.response.data.message : err.response.statusText;

        //     // Activate the modal
        //     this.setState({
        //         modalErrorOpen: true,
        //         modalErrorText: message,
        //     });
        //     this.stopLoading();
        // });
    }
}
