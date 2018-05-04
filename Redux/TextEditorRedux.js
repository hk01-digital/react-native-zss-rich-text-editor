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
  uploading: List(),
  uploaded: List(),
  uploadFailed: List(),
  hasError: null,
  errorMessage: '',
  isCompleted: true,
  failedCount: 0
})

/* ------------- Reducers ------------- */

export const request = (state, { images }) => {
  const isCompleted = state.get('isCompleted')

  if (isCompleted) {
  state = state 
    .set('uploading', List())
    .set('uploaded', List())
    .set('uploadFailed', List())
  }
  let uploadingImages = state.get('uploading')
  images.map(image => {
    if (!R.isNil(image.localId)) {
      uploadingImages = uploadingImages.push(image.localId)
    }
  })
  return state.set('uploading', List(uploadingImages))
  // reset failedCount
  .set('isCompleted', false)
  .set('failedCount', 0)
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
  let uploadingImages = state.get('uploading')
  let uploadedImages = state.get('uploaded')
  let uploadFailedImages = state.get('uploadFailed')

  // upload success
  if (uploadingImages.size === uploadedImages.size + uploadFailedImages.size) {
    return state.set('failedCount', uploadFailedImages.size)
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
