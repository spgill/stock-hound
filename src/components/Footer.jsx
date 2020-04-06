// vendor imports
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Icon,
    Slide,
    Typography,
    withMobileDialog,
} from '@material-ui/core';
import React from 'react';

// local imports
import theme from '../config/theme';

// asset imports
import aboutCopy from '../copy/about.md';
import privacyCopy from '../copy/privacy-policy.md';


// Transition element for the dialogs
function DialogTransition(props) {
    return <Slide direction='up' {...props} />;
}


// The dialog for the "About this application" button/link
function AboutDialog(props) {
    return <Dialog
        {...props}
        TransitionComponent={DialogTransition}
    >
        <DialogTitle>About <em>{theme.title}</em></DialogTitle>
        <DialogContent>
            <Typography dangerouslySetInnerHTML={{__html: aboutCopy}} />
        </DialogContent>
        <DialogActions>
            <Button
                color='primary'
                variant='outlined'
                onClick={props.onClose}
            >Dismiss</Button>
        </DialogActions>
    </Dialog>;
}
const ResponsiveAboutDialog = withMobileDialog()(AboutDialog);


// Dialog for the Privacy Policy
function PrivacyDialog(props) {
    return <Dialog
        {...props}
        TransitionComponent={DialogTransition}
    >
        <DialogTitle>Privacy Policy</DialogTitle>
        <DialogContent>
            <Typography dangerouslySetInnerHTML={{__html: privacyCopy}} />
        </DialogContent>
        <DialogActions>
            <Button
                color='primary'
                variant='outlined'
                onClick={props.onClose}
            >Dismiss</Button>
        </DialogActions>
    </Dialog>;
}
const ResponsivePrivacyDialog = withMobileDialog()(PrivacyDialog);


// Footer element placed on the bottom of the page
export default class Footer extends React.Component {
    constructor(...args) {
        super(...args);

        this.state = {
            dialogAboutIsOpen: false,
            dialogPrivacyIsOpen: false,
        };
    }

    render() {
        return <React.Fragment>
            <Typography
                align='center'
                variant='caption'
            >
                Made with <Icon fontSize='inherit' color='primary'>favorite</Icon> in Austin, TX. <a
                    href='#'
                    onClick={this.dialogAboutOpen}
                >About this application</a>.
            </Typography>
            <Typography
                align='center'
                variant='caption'
            >
                By using this application, you agree to our <a
                    href='#'
                    onClick={this.dialogPrivacyOpen}
                >Privacy Policy</a> .
            </Typography>
            <ResponsiveAboutDialog
                open={this.state.dialogAboutIsOpen}
                onClose={this.dialogAboutClose}
            />
            <ResponsivePrivacyDialog
                open={this.state.dialogPrivacyIsOpen}
                onClose={this.dialogPrivacyClose}
            />
        </React.Fragment>;
    }

    dialogAboutOpen = () => {
        this.setState({
            dialogAboutIsOpen: true,
        });
    }

    dialogAboutClose = () => {
        this.setState({
            dialogAboutIsOpen: false,
        });
    }

    dialogPrivacyOpen = () => {
        this.setState({
            dialogPrivacyIsOpen: true,
        });
    }

    dialogPrivacyClose = () => {
        this.setState({
            dialogPrivacyIsOpen: false,
        });
    }
}
