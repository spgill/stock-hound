import styled from 'styled-components';

import theme from '../config/theme';


const CarouselItem = styled.div`
    flex-shrink: 0;

    display: flex;

    flex-direction: column;
    justify-content: center;
    align-items: center;

    transition: margin ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut};

    width: 100%;
    height: 100%;

    &:not(:first-child) {
        margin-left: ${theme.spacing.unit}px;
    }
`;

const CarouselContainer = styled.div`
    display: flex;

    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    overflow-x: hidden;

    margin-top: ${theme.spacing.unit}px;

    > ${CarouselItem}:first-child {
        margin-left: ${props => `calc(-${100 * props.frame}% - ${theme.spacing.unit * props.frame}px)`};
    }
`;


export default class Carousel extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const saneFrame = Math.max(Math.min(
            React.Children.count(this.props.children),
            this.props.frame || 0
        ), 0);

        return <CarouselContainer {...this.props} frame={saneFrame}>
            {React.Children.map(this.props.children, (child, i) => <CarouselItem key={i}>{child}</CarouselItem>)}
            {/* {this.props.children} */}
        </CarouselContainer>;
    }
}
