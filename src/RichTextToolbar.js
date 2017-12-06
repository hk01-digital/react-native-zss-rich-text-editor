import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {ListView, View, TouchableOpacity, Image, StyleSheet, Dimensions} from 'react-native';
import {actions} from './const';
import ImagePicker from 'react-native-image-crop-picker'
import parse5 from 'react-native-parse-html'

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
  actions.takePicture,
  actions.insertImage,
];

function getDefaultIcon() {
  const texts = {};
  texts[actions.hashTag] = require('../img/icon_format_bold.png');
  texts[actions.takePicture] = require('../img/icon_format_italic.png');
  texts[actions.insertImage] = require('../img/icon_format_media.png');
  texts[actions.setBold] = require('../img/icon_format_bold.png');
  texts[actions.setItalic] = require('../img/icon_format_italic.png');
  texts[actions.insertBulletsList] = require('../img/icon_format_ul.png');
  texts[actions.insertOrderedList] = require('../img/icon_format_ol.png');
  texts[actions.insertLink] = require('../img/icon_format_link.png');
  return texts;
}

export default class RichTextToolbar extends Component {
  imageCounter: number
  imageGroupCounter: number

  static propTypes = {
    getEditor: PropTypes.func.isRequired,
    actions: PropTypes.array,
    onPressAddLink: PropTypes.func,
    onPressAddImage: PropTypes.func,
    onCameraBtnPressed: PropTypes.func,
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
    this.imageCounter = 0
    this.imageGroupCounter = 0
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

  getRows(actions, selectedItems) {
    return actions.map((action) => {return {action, selected: selectedItems.includes(action)};});
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
    return (
      <TouchableOpacity
          key={action}
          style={[
            styles.toolbarBtn,
            selected ? this._getButtonSelectedStyle() : this._getButtonUnselectedStyle()
          ]}
          onPress={() => this._onPress(action)}
      >
        {icon ? <Image source={icon} style={{tintColor: selected ? this.props.selectedIconTint : this.props.iconTint}}/> : null}
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

  // TODO: move all html parsing related function to new class
  async getHTML () {
    const content = await this.state.editor.getContentHtml()
    console.log('getHTML', content)
    this.parseHTML(content)
  }

  parseHTML(html) {
    var result = {}
    var blocks = []
    var fragment = parse5.parseFragment(html)
    fragment.childNodes.map(node => {
      console.log("node :", node)
      var block = {}
      switch(node.nodeName) {
        case 'p':
          block = this.textBlockFromNode(node)
          break

        case 'div':
          block = this.imageBlocksFromNode(node)
          break

        default:
          console.log("Other Node :", node.nodeName)
      }
      if (this.isValidBlock(block)) {
        blocks.push(block)
      }
    })
    result['blocks'] = blocks
    const jsonResult = JSON.stringify(result)
    console.log('jsonResult :', jsonResult)
  }

  textBlockFromNode = (node) => {
    var block = {}
    var text = this.textFromNode(node)
    if (text != '') {
      block['blockType'] = 'Text'
      block['htmlContent'] = text
    }
    return block
  }

  imageBlocksFromNode = (node) => {
    var block = {}
    var imageBlocks = []
    // loop all imageContainers inside a group
    node.childNodes.map(imageContainer => {
      // get the image inside container
      var image = imageContainer.childNodes[imageContainer.childNodes.length - 1]
      
      var imageBlock = {}
      image && image.attrs.map(attr => {
        switch(attr.name) {
          case 'localidentifier':
            imageBlock['mediaId'] = attr.value
            break
          case 'index':
            // TODO: replace this dummy url to real one from uploadImage api response
            imageBlock['url'] = "cdn.hk01.com/image/"+attr.value
            break
          case 'mime':
            const format = attr.value
            imageBlock['format'] = format.substring(format.lastIndexOf("/") + 1, format.length)
            break
          case 'originalwidth':
            imageBlock['width'] = parseInt(attr.value)
            break
          case 'originalheight':
            imageBlock['height'] = parseInt(attr.value)
            break
        }
      })
      if (imageBlock['mediaId'] != undefined) {
        imageBlocks.push(imageBlock)
      }
    })

    if (imageBlocks.length > 0) {
      block['blockType'] = 'image'
      block['images'] = imageBlocks
    }
    return block
  }
  
  isValidBlock = (block) => {
    return block['blockType'] != undefined
  }

  textFromNode = (node) => {
    var text = ''
    node.childNodes && node.childNodes.map(childNode => {
      if (childNode.nodeName === '#text') {
        text = childNode.value
      }
    })
    return text
  }

  idFromNode = (node) => {
    var id = ''
    node.attrs.map(attr => {
      if (attr.name === 'id')
        id = attr.value
    })
    return id
  }

  onPressAddImage () {
    const width = Dimensions.get('window').width
    const editor = this.props.getEditor();
    ImagePicker.openPicker({
      multiple: true,
      includeBase64: true,
      mediaType: 'photo',
      compressImageMaxWidth: 500,
      compressImageMaxHeight: 500
    }).then(images => {

      const closeImageData =
      'data:image/png;base64,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' +
      'ugAAAABJRU5ErkJggg=='

      let isMultiple = images.length > 1

      images.map(image => {
        image.src = 'data:image/png;base64,' + image.data
        image.data = undefined
        
        // calculate correct image size for display
        let ratio = image.width / image.height
        image.originalWidth = image.width
        image.originalHeight = image.height

        if (isMultiple && this.props.isGridView) {
          image.width = width / 3
          image.height = image.width
        } else {
          image.width = width
          image.height = width / ratio
        }
        image.index = this.imageCounter
        image.groupId = this.imageGroupCounter
  
        // all prop of image here will be passed as prop of <img> in webview
        editor.insertImage(image, closeImageData)
        this.imageCounter++
      })
      this.imageGroupCounter++
    })
  }

  render() {
    return (
      <View
          style={[styles.container, this.props.style]}
      >
        <View style={styles.toolbarRow}>
          {this._renderActionBtnContainer(leftActions)}
          {this._renderActionBtnContainer(rightActions)}
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
      case actions.takePicture:
        this.state.editor.prepareInsert();
        if(this.props.onCameraBtnPressed) {
          this.props.onCameraBtnPressed();
        }
        break;
      case actions.hashTag:
        this.getHTML()
        break;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    height: 50, 
    backgroundColor: 'rgb(238,238,238)', 
  },  
  toolbarRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }, 
  toolbarBtnContainer: {
    flexDirection: 'row',
  }, 
  toolbarBtn: {
    height: 50, 
    width: 50, 
    justifyContent: 'center'
  },
  defaultSelectedButton: {
    backgroundColor: 'red'
  },
  defaultUnselectedButton: {},
});