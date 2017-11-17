import { Modal } from 'carbon-components-react';

export default class Footer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modalOpen: true,
        };
    }

    render() {
        return <div className='sh-Footer'>
            <p>
                &copy; 2017 Samuel P. Gillispie II &#8226;
                Made with <img src={require('../../image/noun_96615_cc.svg')} /> in Austin, Texas<br/>
                <a href="#" onClick={() => this.setState({modalOpen: true})}>Attributions and Disclaimers</a>.
                Works best on <a href="http://www.google.com/chrome/">Google Chrome</a>.
            </p>

            {/* Attributions modal dialog */}
            <Modal
                passiveModal
                open={this.state.modalOpen}
                modalLabel=''
                modalHeading='Attributions and Disclaimers'
                onRequestClose={() => this.setState({modalOpen: false})}
            >
                <p className='bx--modal-content__text'>
                    <p>
                        Neither I, Samuel P. Gillispie II (the creator and developer), nor
                        this web application, "Stöck Høund," are affiliated in any way with IKEA
                        USA or Inter IKEA Systems B.V. This is a purely not-for-profit
                        application intended to demonstrate the utility of such a service
                        in IKEA's North American market.
                    </p><br />

                    <p>
                        This application is operated using the same publicly available data
                        found on the IKEA USA website, and data provided by users of the
                        application. I believe this constitutes a fair use of the services
                        provided by IKEA USA's network. Details of collected user data
                        can be made available upon request.
                    </p><br />

                    <p>
                        This application's source code is available openly on&nbsp;
                        <a href="https://github.com/spgill/stock-hound">my GitHub</a> and is
                        published under the <a href="https://opensource.org/licenses/MIT">MIT License</a>.
                    </p><br />

                    <p>
                        I can be contacted at any time by email at <a href="mailto:samuel@spgill.me">samuel@spgill.me</a>.
                    </p><br />

                    <hr />

                    <p>
                        This is not an exhaustive list of all works used,
                        but I am only one human so ¯\_(ツ)_/¯
                    </p><br />

                    <ul className='sh-Footer__list'>
                        <li>IBM Cloud's Carbon Design System</li>
                        <li>“Dog” icon by Egon Låstad, from thenounproject.com.</li>
                        <li>“Heart” icon by Lloyd Humphreys, from thenounproject.com.</li>
                    </ul>
                </p>
            </Modal>
        </div>;
    }
}
