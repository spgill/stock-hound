import axios from 'axios';
import classNames from 'classnames';

import {
    Button,
    Card,
    Loading,
    Modal,
    Select, SelectItem,
    TextInput,
} from 'carbon-components-react';
import Recaptcha from 'react-google-recaptcha';

import Footer from './Footer.jsx';
import { setTimeout } from 'core-js/library/web/timers';


const randId = () => _.sampleSize('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8).join('')


export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            // Loading states
            loadingStores: true,
            loadingKey: true,
            loadingRequest: false,

            // Store selection values
            storeList: null,
            country: 'us',
            store: '',

            // Form values
            article: '',
            email: '',
            recaptchaKey: '',
            recaptchaResponse: '',

            // Confirm modal values
            modalConfirmOpen: false,

            // Error modal values
            modalErrorOpen: false,
            modalErrorText: '',

            // Success modal values
            modalSuccessOpen: false,
        };

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
        axios.get('/key').then(resp => {
            this.setState({
                loadingKey: false,
                recaptchaKey: resp.data,
            });
        });
    }

    render() {
        // If loading globally, only render a loading wheel
        if (this.state.loadingStores || this.state.loadingKey) {
            return <Loading withOverlay={false} />;
        }

        // Else render the app itself
        else {
            const columnClasses = 'bx--col-xs-12 bx--col-sm-10 bx--col-md-8 bx--col-lg-6 bx--col-xl-5 bx--col-xxl-4';

            return <div className='sh-Grid__flex bx--grid'>

                {/* Title row */}
                <div className='sh-Grid__row--center-x bx--row'>
                    <div className={`sh-App__title bx--col-xs-12`}>
                        <h1>Stöck Høund</h1>
                        <img src={require('../../image/hound.svg')} />
                    </div>
                </div>

                <br/>

                {/* Card row */}
                <div className='sh-Grid__row--center-x bx--row'>
                    <Card className={`sh-Card ${columnClasses}`}>

                        {/* Informational blurb */}
                        <p className='sh-Card__blurb'>
                            We can notify you the next time a product comes in stock at your
                            local IKEA store. To get started, just choose your local store,
                            provide the product's article number, and then fill in your
                            email address. You are allowed up to 5 active product
                            reminders per email address.
                        </p>

                        <br/>

                        {/* Store selection line */}
                        <div className='sh-Card__form-line'>
                            <Select
                                id={randId()}
                                disabled={this.state.loadingRequest}
                                hideLabel={true}
                                value={this.state.country}
                                onChange={this.changeCountry}
                            >
                                <SelectItem text='USA' value='us' />
                                <SelectItem text='Canada' value='ca' />
                            </Select>
                            <Select
                                id={randId()}
                                disabled={this.state.loadingRequest}
                                hideLabel={true}
                                value={this.state.store}
                                onChange={ev => this.setState({store: ev.target.value})}
                            >
                                {Object.keys(this.state.storeList[this.state.country]).map(storeName => {
                                    const storeId = this.state.storeList[this.state.country][storeName];
                                    return <SelectItem
                                        key={storeId}
                                        value={storeId}
                                        text={storeName}
                                    />;
                                })}
                            </Select>
                        </div>

                        {/* Article entry */}
                        <div className='sh-Card__form-line'>
                            <TextInput
                                id={randId()}
                                disabled={this.state.loadingRequest}
                                hideLabel={true}
                                placeholder='Product URL or article number'
                                value={this.state.article}
                                onChange={ev => this.setState({article: ev.target.value})}
                            />
                        </div>

                        {/* Email address entry */}
                        <div className='sh-Card__form-line'>
                            <TextInput
                                id={randId()}
                                disabled={this.state.loadingRequest}
                                hideLabel={true}
                                placeholder='Email address'
                                value={this.state.email}
                                onChange={ev => this.setState({email: ev.target.value})}
                            />
                        </div>

                        {/* Recaptcha line */}
                        <div className='sh-Card__form-line sh-Card__form-line--recaptcha'>
                            <div className='sh-Card__form-emoji'>
                                <img src={require('../../image/emoji_u1f6ab.svg')} />
                                <img src={require('../../image/emoji_u1f916.svg')} />
                            </div>
                            <Recaptcha
                                ref={node => {this.recaptchaNode = node}}
                                sitekey={this.state.recaptchaKey}
                                onChange={this.recaptchaCallback}
                            />
                        </div>

                        {/* Submission button */}
                        <div className={classNames({
                            'sh-Card__submit-line': true,
                            'sh-Card__submit-line--loading': this.state.loadingRequest,
                        })}>
                            <Loading small active={this.state.loadingRequest} withOverlay={false} />
                            <Button
                                disabled={!this.formReady() || this.state.loadingRequest}
                                onClick={this.submit}
                            >Create Reminder</Button>
                        </div>

                    </Card>
                </div>

                {/* Confirmation modal dialog */}
                <Modal
                    open={this.state.modalConfirmOpen}
                    modalLabel=''
                    modalHeading='Confirmation required'
                    primaryButtonText='Continue'
                    secondaryButtonText='Cancel'
                    onRequestClose={this.confirmCancel}
                    onSecondarySubmit={this.confirmCancel}
                    onRequestSubmit={this.confirm}
                >
                    <p className='bx--modal-content__text'>
                        You have reached your limit of 5 reminders.
                        If you continue, your oldest reminder will be terminated.
                    </p>
                </Modal>

                {/* Error modal dialog */}
                <Modal
                    passiveModal
                    open={this.state.modalErrorOpen}
                    modalLabel=''
                    modalHeading='Error encountered'
                    onRequestClose={() => this.setState({modalErrorOpen: false})}
                >
                    <p className='bx--modal-content__text'>{this.state.modalErrorText}</p>
                </Modal>

                {/* Success modal dialog */}
                <Modal
                    passiveModal
                    open={this.state.modalSuccessOpen}
                    modalLabel=''
                    modalHeading='Success!'
                    onRequestClose={() => this.setState({modalSuccessOpen: false})}
                >
                    <p className='bx--modal-content__text'>Reminder successfully created. Check your email inbox for verification.</p>
                </Modal>

                {/* Static footer */}
                <Footer />
            </div>;
        }
    }

    changeCountry = (ev) => {
        const newCountry = ev.target.value;
        const newStoreId = Object.keys(this.state.storeList[newCountry])[0];

        this.setState({
            country: newCountry,
            store: this.state.storeList[newCountry][newStoreId],
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
        return this.state.email.length
            && this.state.article.length
            && this.state.recaptchaResponse.length;
    }

    startLoading = () => {
        this.setState({
            loadingRequest: true,
        });
    }

    stopLoading = () => {
        this.recaptchaNode.reset();
        setTimeout(() => {
            this.setState({
                loadingRequest: false,
            });
        }, 382);
    }

    confirm = () => {
        this.setState({modalConfirmOpen: false});
        this.submit(null, true);
    }

    confirmCancel = () => {
        this.setState({modalConfirmOpen: false});
        this.stopLoading();
    }

    submit = (ev, confirmed=false) => {
        // If (somehow) they haven't provided everything, show an error
        if (!this.formReady()) {
            this.setState({
                modalErrorOpen: true,
                modalErrorText: 'You have not filled out all the form fields, or have not completed the recaptcha.'
            });
            return;
        }

        // Start the loading state
        this.startLoading();

        // setTimeout(() => this.setState({loadingRequest: false}), 1618);

        //Make the api request
        const req = axios.post('/submit', {
            address: this.state.email,
            product: this.state.article,
            country: this.state.country,
            location: this.state.store,
            recaptcha: this.state.recaptchaResponse,
            confirm: confirmed,
        })

        // On success
        req.then((resp) => {
            // If the response's payload is 'confirm', then we need confirmation
            if (resp.data.payload == 'confirm') {
                this.setState({
                    modalConfirmOpen: true,
                });
            }

            // Else, the reminder was successfully created
            else {
                this.setState({
                    modalSuccessOpen: true,
                });
                this.stopLoading();
            }
        });

        // On failure :(
        req.catch(err => {
            // If this is an api error, then there will be a specific message
            const message = 'message' in err.response.data ?
                err.response.data.message : err.response.statusText;

            // Activate the modal
            this.setState({
                modalErrorOpen: true,
                modalErrorText: message,
            });
            this.stopLoading();
        });
    }
}
