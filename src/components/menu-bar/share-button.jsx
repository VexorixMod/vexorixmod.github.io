import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import Button from '../button/button.jsx';

import styles from './share-button.css';

const getProjectThumbnail = () => {
    return new Promise((resolve, reject) => {
        window.vm.renderer.requestSnapshot(uri => {
            resolve(uri);
        })
    })
}
const getProjectUri = () => {
    return new Promise((resolve, reject) => {
        window.vm.saveProjectSb3().then(blob => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = element => {
                    resolve(element.target.result);
                }
                reader.readAsDataURL(blob);
            })
        }).then(resolve);
    })
}

const isUploadAvailable = async () => {
    let res = null;
    try {
        res = await fetch('https://projects.penguinmod.site/api');
    } catch {
        // failed to fetch entirely
        return false;
    }
    return res.ok;
};

class ShareButton extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleMessageEvent',
            'onUploadProject'
        ]);
        this.state = {
            loading: false
        }
    }
    componentDidMount() {
        document.addEventListener('message', this.handleMessageEvent);
    }
    componentWillUnmount() {
        document.removeEventListener('message', this.handleMessageEvent);
    }
    async handleMessageEvent(e) {
        if (!e.origin.startsWith(`https://penguinmod.site`)) {
            return;
        }

        if (!e.data.p4) {
            return
        }

        const packagerData = e.data.p4;
        if (packagerData.type !== 'validate') {
            return;
        }

        const imageUri = await getProjectThumbnail();
        e.source.postMessage({
            p4: {
                type: 'image',
                uri: imageUri
            }
        }, e.origin);
        const projectUri = await getProjectUri();
        e.source.postMessage({
            p4: {
                type: 'project',
                uri: projectUri
            }
        }, e.origin);
        e.source.postMessage({
            p4: {
                type: 'finished'
            }
        }, e.origin);
    }
    onUploadProject() {
        this.setState({
            loading: true
        });
        isUploadAvailable().then(available => {
            this.setState({
                loading: false
            });
            if (!available) {
                // error?
                console.warn('Project Server did not respond. Uploading is not available.');
                alert('Uploading is currently unavailable. Please wait for the server to be restored.');
                return;
            }
            // we are available
            let _projectName = document.title.split(" - ");
            _projectName.pop();
            const projectName = _projectName.join(" - ");

            const url = location.origin;
            window.open(`https://penguinmod.site/upload?name=${encodeURIComponent(projectName)}&external=${url}`, "_blank");
        });
    }
    render() {
        return (
            <Button
                className={classNames(
                    this.props.className,
                    styles.shareButton,
                    { [styles.shareButtonIsShared]: this.props.isShared }
                )}
                onClick={this.onUploadProject}
            >
                <FormattedMessage
                    defaultMessage="Upload"
                    description="Label for project share button"
                    id="gui.menuBar.pmshare"
                />
                {this.state.loading ? (
                    <p>Please wait...</p>
                ) : null}
            </Button>
        );
    }
}

ShareButton.propTypes = {
    className: PropTypes.string,
    isShared: PropTypes.bool
};

export default ShareButton;
