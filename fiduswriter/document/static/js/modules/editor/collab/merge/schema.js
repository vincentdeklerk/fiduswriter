import {Schema} from "prosemirror-model"

export function parseDiff(str) {
    if (!str) {
        return []
    }
    let tracks
    try {
        tracks = JSON.parse(str)
    } catch (error) {
        return []
    }
    if (!Array.isArray(tracks)) {
        return []
    }
}

export const createDiffSchema = function(docSchema) {
    let specNodes = docSchema.spec.nodes

    specNodes.forEach(nodeTypeName => {
        const nodeType = specNodes.get(nodeTypeName)
        if (nodeType.group !== 'block') {
            return
        }
        const attrs = nodeType.attrs
        specNodes = specNodes.update(
            nodeTypeName,
            Object.assign(
                {},
                nodeType,
                {
                    attrs: Object.assign({diffdata: {default: []}}, attrs),
                    toDOM: function(node) {
                        let dom = nodeType.toDOM(node)
                        if (node.attrs.diffdata && node.attrs.diffdata.length) {
                            dom = [
                                dom[0],
                                Object.assign({
                                    'data-diffdata': JSON.stringify(node.attrs.diffdata),
                                    'class': node.attrs.diffdata[0].type
                                }, dom[1]),
                                dom[2]
                            ]
                        }
                        return dom
                    },
                    parseDOM: nodeType.parseDOM.map(tag => ({
                        tag: tag.tag,
                        getAttrs: function(dom) {
                            const attrs = tag.getAttrs(dom)
                            return Object.assign({
                                diffdata: parseDiff(dom.dataset.diffdata)
                            }, attrs)
                        }
                    }))
                }
            )
        )
    })



    const diffdata = {
        attrs: {
            diff: {
                default: ""
            },
            steps: {
                default: []
            },
            from: {
                default: ''
            },
            to: {
                default: ''
            }
        },
        parseDOM: [
            {
                tag: "span.diff",
                getAttrs(dom) {
                    return {
                        diff: dom.dataset.diff,
                        steps: dom.dataset.steps,
                    }
                }
            }
        ],
        toDOM(node) {
            return ['span', {
                class: `diff ${node.attrs.diff}`,
                'data-diff': node.attrs.diff,
                'data-steps': node.attrs.steps,
                'data-from': node.attrs.from,
                'data-to': node.attrs.to
            }]
        }
    }

    const spec = {
        nodes: specNodes,
        marks: docSchema.spec.marks.addToEnd('diffdata', diffdata)
    }

    //return docSchema
    return new Schema(spec)
}
