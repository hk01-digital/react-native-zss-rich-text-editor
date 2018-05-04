import { createReducer, createActions } from 'reduxsauce'
import { Map, List } from 'immutable'
import * as R from 'ramda'

/* ------------- Types and Action Creators ------------- */

const { Types, Creators } = createActions({
  textEditorRequest: ['images'],
  textEditorSuccess: ['imgUrl', 'mediaId', 'imgLocalId'],
  textEditorFailure: ['errorMessage', 'imgLocalId'],
  textEditorUpdatedImage: null
})

export const TextEditorTypes = Types
export default Creators

/* ------------- Initial State ------------- */

export const INITIAL_STATE = Map({
  data: Map(),
  uploadImageCount: 0,
  uploading: List(),
  uploaded: List(),
  uploadFailed: List(),
  hasError: null,
  errorMessage: '',
  isCompleted: true,
})

/* ------------- Reducers ------------- */

export const request = (state, { images }) => {
  const isCompleted = state.get('isCompleted')

  if (isCompleted) {
  state = state 
    .set('uploading', List())
    .set('uploaded', List())
    .set('uploadFailed', List())
    .set('uploadImageCount', 0)
  }
  const uploadImageCount = state.get('uploadImageCount')
  let uploadingImages = state.get('uploading')
  images.map(image => {
    if (!R.isNil(image.localId)) {
      uploadingImages = uploadingImages.push(image.localId)
    }
  })
  return state.set('uploading', List(uploadingImages))
  .set('isCompleted', false)
  .set('uploadImageCount', uploadImageCount + 1)
}

export const success = (
  state,
  { imgUrl, mediaId, imgLocalId }
) => {
  let uploadedImages = state.get('uploaded')

  uploadedImages = uploadedImages.push(imgLocalId)

  let newState = state
    .merge({
      hasError: false,
      errorMessage: '',
      imgUrl,
      mediaId,
      imgLocalId,
    })
    .set('uploaded', List(uploadedImages))
    return checkIfUploadCompleted(newState)
  }

export const failure = (state, {errorMessage, imgLocalId} ) => {
  let uploadFailedImages = state.get('uploadFailed')

  uploadFailedImages = uploadFailedImages.push(imgLocalId)
  let newState = state
    .merge({
      hasError: true,
      errorMessage,
    })
    .set('uploadFailed', List(uploadFailedImages))
  return checkIfUploadCompleted(newState)
}

export const clearImageData = ( state ) => {
  return state
  .merge({
    imgUrl: null,
    mediaId: null,
    imgLocalId: null,
  })
}

const checkIfUploadCompleted = ( state ) => {
  const uploadImageCount = state.get('uploadImageCount')
  let uploadedImages = state.get('uploaded')
  let uploadFailedImages = state.get('uploadFailed')

  // upload success
  if (uploadImageCount === uploadedImages.size + uploadFailedImages.size) {
    return state
    .set('isCompleted', true)
  }
  return state
}

/* ------------- Hookup Reducers To Types ------------- */

export const reducer = createReducer(INITIAL_STATE, {
  [Types.TEXT_EDITOR_REQUEST]: request,
  [Types.TEXT_EDITOR_SUCCESS]: success,
  [Types.TEXT_EDITOR_FAILURE]: failure,
  [Types.TEXT_EDITOR_UPDATED_IMAGE]: clearImageData,
})
