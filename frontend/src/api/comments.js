import client from './client'

export const getComments = (issueId) => client.get(`/issues/${issueId}/comments`)
export const createComment = (issueId, data) => client.post(`/issues/${issueId}/comments`, data)
