import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {ListView, View, TouchableOpacity, Image, StyleSheet, Dimensions} from 'react-native';
import {actions} from './const';
import ImagePicker from 'react-native-image-crop-picker'
import TextEditorRedux from '../../../node_modules/react-native-zss-rich-text-editor/Redux/TextEditorRedux'
import { connect } from 'react-redux'
import parse5 from 'react-native-parse-html'
import { imagePerRow } from './RichTextEditor'

const defaultActions = [
  actions.insertImage,
  actions.setBold,
  actions.setItalic,
  actions.insertBulletsList,
  actions.insertOrderedList,
  actions.insertLink
];

// Custom Action
const leftActions = [
  actions.hashTag
];

const rightActions = [
  actions.takeVideo,
  actions.insertImage,
];

function getDefaultIcon() {
  const texts = {};
  texts[actions.hashTag] = require('../img/icoTag.png');
  texts[actions.takeVideo] = require('../img/icoYoutubeUrl.png');
  texts[actions.insertImage] = require('../img/icoCamera.png');
  texts[actions.setBold] = require('../img/icon_format_bold.png');
  texts[actions.setItalic] = require('../img/icon_format_italic.png');
  texts[actions.insertBulletsList] = require('../img/icon_format_ul.png');
  texts[actions.insertOrderedList] = require('../img/icon_format_ol.png');
  texts[actions.insertLink] = require('../img/icon_format_link.png');
  return texts;
}

type Props = {
  navigation: Object,
  accountId: number,
  hasError: boolean,
  errorMessage: string,
  uploadImage: Function,
  imgLocalId: string,
  hasTags: boolean,
}

type State = {
}

class RichTextToolbar extends Component {

  static propTypes = {
    getEditor: PropTypes.func.isRequired,
    actions: PropTypes.array,
    onPressAddLink: PropTypes.func,
    onPressAddImage: PropTypes.func,
    onVideoBtnPressed: PropTypes.func,
    onHashTagBtnPressed: PropTypes.func,
    selectedButtonStyle: PropTypes.object,
    iconTint: PropTypes.any,
    selectedIconTint: PropTypes.any,
    unselectedButtonStyle: PropTypes.object,
    renderAction: PropTypes.func,
    iconMap: PropTypes.object,
    isGridView: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    const actions = this.props.actions ? this.props.actions : defaultActions;
    this.state = {
      editor: undefined,
      selectedItems: [],
      actions,
      ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}).cloneWithRows(this.getRows(actions, []))
    };
  }

  componentDidReceiveProps(newProps) {
    const actions = newProps.actions ? newProps.actions : defaultActions;
    this.setState({
      actions,
      ds: this.state.ds.cloneWithRows(this.getRows(actions, this.state.selectedItems))
    });
  }

  componentDidMount() {
    const editor = this.props.getEditor();
    if (!editor) {
      throw new Error('Toolbar has no editor!');
    } else {
      editor.registerToolbar((selectedItems) => this.setSelectedItems(selectedItems));
      this.setState({editor});
    }
  }

  componentDidUpdate() {
    const imgUrl = this.props.imgUrl
    const imgLocalId = this.props.imgLocalId

    if (imgUrl && imgLocalId) {
      const editor = this.props.getEditor();
      editor.updateImageWithUrl(imgUrl, imgLocalId)
    }
  }
  
  getRows(actions, selectedItems) {
    return actions.map((action) => {return {action, selected: selectedItems.includes(action)};});
  }

  setSelectedItems(selectedItems) {
    if (selectedItems !== this.state.selectedItems) {
      this.setState({
        selectedItems,
        ds: this.state.ds.cloneWithRows(this.getRows(this.state.actions, selectedItems))
      });
    }
  }

  _getButtonSelectedStyle() {
    return this.props.selectedButtonStyle ? this.props.selectedButtonStyle : styles.defaultSelectedButton;
  }

  _getButtonUnselectedStyle() {
    return this.props.unselectedButtonStyle ? this.props.unselectedButtonStyle : styles.defaultUnselectedButton;
  }

  _getButtonIcon(action) {
    if (this.props.iconMap && this.props.iconMap[action]) {
      return this.props.iconMap[action];
    } else if (getDefaultIcon()[action]){
      return getDefaultIcon()[action];
    } else {
      return undefined;
    }
  }

  _defaultRenderAction(action, selected) {
    const icon = this._getButtonIcon(action);
    let view = null
    const shouldShowUnderline = action === actions.hashTag && this.props.hasTags
    const style = shouldShowUnderline? [styles.toolbarBtnUnderline, styles.toolbarBtnUnderlineColor] : styles.toolbarBtnUnderline
    return (
      <TouchableOpacity
          key={action}
          style={[
            styles.toolbarBtn,
            selected ? this._getButtonSelectedStyle() : this._getButtonUnselectedStyle()
          ]}
          onPress={() => this._onPress(action)}
      >
        <View style={styles.btnImageContainer}>
          {icon ? <Image source={icon} style={{tintColor: selected ? this.props.selectedIconTint : this.props.iconTint}}/> : null}
        </View>
        <View style={style}></View>
      </TouchableOpacity>
    );
  }

  _renderAction(action, selected) {
    return this.props.renderAction ?
        this.props.renderAction(action, selected) :
        this._defaultRenderAction(action, selected);
  }

  _renderActionBtnContainer = (actions) => {
    let btnArray = []
    actions.map(action => {
      btnArray.push(this._defaultRenderAction(action, false))
    })
    return (
      <View style={styles.toolbarBtnContainer}>
        {btnArray}
      </View>
    )
  }
  
  onPressAddImage = () => {
    const width = Dimensions.get('window').width
    const editor = this.props.getEditor();
    const { isGridView } = this.props
    ImagePicker.openPicker({
      multiple: true,
      includeBase64: true,
      mediaType: 'photo',
      compressImageMaxWidth: 500,
      compressImageMaxHeight: 500,
      smartAlbums: ['UserLibrary'],
    }).then(images => {

      const closeImageData =
      'data:image/png;base64,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' +
      'ugAAAABJRU5ErkJggg=='

      let groupId = this.randomIdentifier()

      images.reverse().map(image => {
        image.localId = this.randomIdentifier()
        // GridView only need 1 image group container
        image.groupId = isGridView? 0 : groupId

        image.src = 'data:image/png;base64,' + image.data
        image.data = undefined

        // Handling for android
        if (image.filename === undefined) {
          image.filename = image.path.substring(image.path.lastIndexOf('/')+1, image.path.length)
        }
        if (image.sourceURL === undefined) {
          image.sourceURL = image.path
        }
        // temp fix, since this is required by api at the moment, although it seems it is not used anywhere
        if (image.localidentifier === undefined) {
          image.localidentifier = image.localId
        }

        this.props.uploadImage([image]);
        
        // calculate correct image size for display
        let ratio = image.width / image.height
        image.originalWidth = image.width
        image.originalHeight = image.height

        if (this.props.isGridView) {
          image.width = ( width - (5 * (imagePerRow + 1)) ) / imagePerRow
          image.height = image.width
        } else {
          image.width = width
          image.height = width / ratio
        }
  
        // all prop of image here will be passed as prop of <img> in webview
        if (this.props.isGridView) {
          editor.insertImageIntoGrid(image, closeImageData)
        } else {
          editor.insertImage(image, closeImageData)
        }
      })
    })
  }

  randomIdentifier = () => {
    const currentDate = new Date().getTime()
    return currentDate.toString() + Math.random().toString(36).substring(7);
  }

  render() {
    return (
      <View
          style={[styles.container, this.props.style]}
      >
        <View>
          <View style={styles.toolbarUpperline}/>
          <View style={styles.toolbarRow}>
            {this._renderActionBtnContainer(leftActions)}
            {this._renderActionBtnContainer(rightActions)}
          </View>
        </View>
      </View>
    );
  }

  _onPress(action) {
    switch(action) {
      case actions.setBold:
      case actions.setItalic:
      case actions.insertBulletsList:
      case actions.insertOrderedList:
      case actions.setUnderline:
      case actions.heading1:
      case actions.heading2:
      case actions.heading3:
      case actions.heading4:
      case actions.heading5:
      case actions.heading6:
      case actions.setParagraph:
      case actions.removeFormat:
      case actions.alignLeft:
      case actions.alignCenter:
      case actions.alignRight:
      case actions.alignFull:
      case actions.setSubscript:
      case actions.setSuperscript:
      case actions.setStrikethrough:
      case actions.setHR:
      case actions.setIndent:
      case actions.setOutdent:
        this.state.editor._sendAction(action);
        break;
      case actions.insertLink:
        this.state.editor.prepareInsert();
        if(this.props.onPressAddLink) {
          this.props.onPressAddLink();
        } else {
          this.state.editor.getSelectedText().then(selectedText => {
            this.state.editor.showLinkDialog(selectedText);
          });
        }
        break;
      case actions.insertImage:
        this.state.editor.prepareInsert();
        this.onPressAddImage();
        break;
      case actions.takeVideo:
        this.state.editor.prepareInsert();
        if(this.props.onVideoBtnPressed) {
          this.props.onVideoBtnPressed();
        }
        break;
      case actions.hashTag:
      this.props.onHashTagBtnPressed && this.props.onHashTagBtnPressed()
        break;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    height: 50, 
    backgroundColor: 'white', 
  },  
  toolbarRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  }, 
  toolbarBtnContainer: {
    flexDirection: 'row',
  }, 
  toolbarUpperline: {
    height: 1,
    backgroundColor: 'rgb(230, 233, 235)'
  },
  toolbarBtn: {
    height: 50, 
    width: 50, 
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  toolbarBtnUnderline: {
    height: 5,
    width: 50,
  },
  toolbarBtnUnderlineColor: {
    backgroundColor: 'rgb(0, 165, 225)'
  },
  defaultSelectedButton: {
    backgroundColor: 'red'
  },
  defaultUnselectedButton: {},
});

const mapDispatchToProps = dispatch => {
  return {
    uploadImage: (images = null) =>
      dispatch(TextEditorRedux.textEditorRequest(images)),
  }
}

const mapStateToProps = (state, props) => {
  return {
    fetching: state.textEditor.get('fetching'),
    imgUrl: state.textEditor.get('imgUrl'),
    imgLocalId: state.textEditor.get('imgLocalId'),
    errorMessage: state.textEditor.get('errorMessage'),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, null, {
  withRef: true
})(
  RichTextToolbar
)