import { createReducer, createActions } from 'reduxsauce'
import { Map } from 'immutable'

/* ------------- Types and Action Creators ------------- */

const { Types, Creators } = createActions({
  textEditorRequest: ['image'],
  textEditorSuccess: ['imgId', 'imgOriginalSize', 'imgUrl'],
  textEditorFailure: ['errorMessage'],
})

export const TextEditorTypes = Types
export default Creators

/* ------------- Initial State ------------- */

export const INITIAL_STATE = Map({
  data: Map(),
  fetching: false,
  hasError: null,
  errorMessage: '',
  imgId: "fake imgId",
})

/* ------------- Reducers ------------- */

export const request = (state, { image }) => 
  state
    .merge({
      fetching: true,
    })

export const success = (
  state,
  { imgId, imgOriginalSize, imgUrl }
) =>
  state
    .merge({
      fetching: false,
      hasError: false,
      errorMessage: '',
    })

export const failure = (state, errorMessage ) =>
  state
    .merge({
      fetching: false,
      hasError: true,
      errorMessage,
    })

/* ------------- Hookup Reducers To Types ------------- */

export const reducer = createReducer(INITIAL_STATE, {
  [Types.TEXT_EDITOR_REQUEST]: request,
  [Types.TEXT_EDITOR_SUCCESS]: success,
  [Types.TEXT_EDITOR_FAILURE]: failure,
})
