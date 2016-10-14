module.exports = {
	suds: {
		baseUrl: "//session-user-data.webservices.ft.com",
		endpoints: {
			livefyre: {
				init: "/v1/livefyre/init",
				commentCount: "/v1/livefyre/commentcount",
				commentCounts: "/v1/livefyre/commentcounts"
			},
			user: {
				updateUser: "/v1/user/updateuser",
				getAuth: "/v1/user/getauth"
			}
		}
	},
	ccs: {
		baseUrl: "//comment-creation.webservices.ft.com",
		endpoints: {
			getComments: "/v1/getComments",
			postComment: "/v1/postComment",
			deleteComment: "/v1/deleteComment"
		}
	},
	cacheConfig: {
		authBaseName: "comments-prod-auth-",
		initBaseName: "comments-prod-init-"
	},
	livefyre: {
		networkName: "ft"
	}
};
