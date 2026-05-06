'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { useRouter } from 'next/navigation'
import type { StoryTreeNode } from '@/lib/types'
import { BRANCH_COLORS } from '@/lib/utils'

interface StoryBranchTreeProps {
  nodes: StoryTreeNode[]
  storyId: string
}

interface D3Node extends d3.HierarchyPointNode<StoryTreeNode> {
  x: number
  y: number
}

export function StoryBranchTree({ nodes, storyId }: StoryBranchTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Map branch names to colors
  const branchColorMap = useRef<Map<string, string>>(new Map())

  const getColor = useCallback((branchName: string, isCanon: boolean) => {
    if (isCanon) return BRANCH_COLORS[0] // amber for canon
    if (!branchColorMap.current.has(branchName)) {
      const idx = (branchColorMap.current.size % (BRANCH_COLORS.length - 1)) + 1
      branchColorMap.current.set(branchName, BRANCH_COLORS[idx])
    }
    return branchColorMap.current.get(branchName)!
  }, [])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 900

    // nodes[] is already a nested StoryTreeNode tree (built server-side in tree/page.tsx)
    // nodes[0] is the root chapter. We just need to create a flat nodeMap for lookups.
    const nodeMap = new Map<string, StoryTreeNode>()
    const flattenNodes = (n: StoryTreeNode) => {
      nodeMap.set(n.id, n)
      n.children?.forEach(flattenNodes)
    }
    nodes.forEach(flattenNodes)

    // Determine hierarchy root — either single root or wrap multiple roots
    let hierarchyRoot: StoryTreeNode
    if (nodes.length === 1) {
      hierarchyRoot = nodes[0]
    } else {
      hierarchyRoot = {
        id: '__virtual_root__',
        name: '',
        chapterId: '',
        branchId: '',
        branchName: 'canon',
        isCanon: true,
        authorName: '',
        authorId: '',
        chapterNumber: 0,
        readCount: 0,
        children: nodes,
      }
    }

    const hierarchy = d3.hierarchy<StoryTreeNode>(
      hierarchyRoot,
      (d) => (d.children && d.children.length > 0 ? d.children : null)
    )

    const nodeHeight = 110
    const treeDepth = hierarchy.height + 1
    const svgHeight = Math.max(400, treeDepth * nodeHeight + 120)
    const svgWidth = width

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3
      .select(svgRef.current)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)

    // Add zoom behavior
    const g = svg.append('g').attr('transform', 'translate(0, 40)')

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Tree layout — horizontal (left to right)
    const treeLayout = d3
      .tree<StoryTreeNode>()
      .size([svgHeight - 100, svgWidth - 200])
      .separation((a, b) => (a.parent === b.parent ? 1.4 : 2))

    const treeData = treeLayout(hierarchy)

    // Horizontal tree: swap x/y for left-to-right layout
    // Filter out the virtual root node (invisible wrapper)
    const allNodes = treeData.descendants().filter(
      (d) => d.data.id !== '__virtual_root__'
    ) as D3Node[]
    const allLinks = treeData.links().filter(
      (d) => d.source.data.id !== '__virtual_root__'
    )

    // Draw links
    g
      .selectAll('.branch-link')
      .data(allLinks)
      .enter()
      .append('path')
      .attr('class', 'branch-link')
      .attr('d', (d) => {
        const sx = (d.source as D3Node).y + 60
        const sy = (d.source as D3Node).x
        const tx = (d.target as D3Node).y + 60
        const ty = (d.target as D3Node).x
        return `M${sx},${sy} C${(sx + tx) / 2},${sy} ${(sx + tx) / 2},${ty} ${tx},${ty}`
      })
      .attr('stroke', (d) => {
        const targetNode = d.target.data
        return getColor(targetNode.branchName, targetNode.isCanon)
      })
      .attr('stroke-width', (d) => (d.target.data.isCanon ? 2.5 : 1.8))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', (d) => (d.target.data.isCanon ? 'none' : '6,3'))
      .attr('fill', 'none')

    // Draw nodes
    const nodeGroups = g
      .selectAll('.branch-node')
      .data(allNodes)
      .enter()
      .append('g')
      .attr('class', 'branch-node')
      .attr('transform', (d: D3Node) => `translate(${d.y + 60}, ${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        router.push(`/story/${storyId}/branch/${d.data.branchId}/chapter/${d.data.chapterNumber}`)
      })

    // Node circle
    nodeGroups
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) => getColor(d.data.branchName, d.data.isCanon))
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d) => getColor(d.data.branchName, d.data.isCanon))
      .attr('stroke-width', 2.5)

    // Inner dot
    nodeGroups
      .append('circle')
      .attr('r', 6)
      .attr('fill', (d) => getColor(d.data.branchName, d.data.isCanon))

    // Chapter number inside node
    nodeGroups
      .append('text')
      .attr('dy', '-26')
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => getColor(d.data.branchName, d.data.isCanon))
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '600')
      .text((d) => `Ch.${d.data.chapterNumber}`)

    // Chapter title (truncated)
    nodeGroups
      .append('text')
      .attr('dy', '38')
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'Playfair Display, serif')
      .text((d) => {
        const name = d.data.name
        return name.length > 20 ? name.slice(0, 18) + '…' : name
      })

    // Branch name label (only on fork nodes)
    nodeGroups
      .filter((d) => !d.data.isCanon)
      .append('text')
      .attr('dy', '54')
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => getColor(d.data.branchName, d.data.isCanon))
      .attr('fill-opacity', 0.8)
      .attr('font-size', '9px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-style', 'italic')
      .text((d) => `[${d.data.branchName.length > 16 ? d.data.branchName.slice(0, 14) + '…' : d.data.branchName}]`)

    // Hover tooltip
    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'pointer-events-none fixed z-50 hidden')
      .style('background', 'rgba(13, 21, 38, 0.95)')
      .style('border', '1px solid rgba(255,255,255,0.12)')
      .style('border-radius', '10px')
      .style('padding', '10px 14px')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '12px')
      .style('color', '#e2e8f0')
      .style('max-width', '220px')
      .style('box-shadow', '0 8px 24px rgba(0,0,0,0.4)')
      .style('backdrop-filter', 'blur(8px)')

    nodeGroups
      .on('mouseenter', (event, d) => {
        tooltip
          .style('display', 'block')
          .style('left', `${event.clientX + 12}px`)
          .style('top', `${event.clientY - 40}px`)
          .html(`
            <div style="font-weight:600; color:${getColor(d.data.branchName, d.data.isCanon)}; margin-bottom:4px">
              Ch.${d.data.chapterNumber} · ${d.data.name}
            </div>
            <div style="color:#64748b; font-size:10px; margin-bottom:6px">
              ${d.data.isCanon ? '✦ Canon' : `⎇ ${d.data.branchName}`}
            </div>
            <div style="color:#94a3b8; font-size:11px">by @${d.data.authorName}</div>
            <div style="color:#475569; font-size:10px; margin-top:4px">${d.data.readCount} reads · click to read</div>
          `)
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.clientX + 12}px`)
          .style('top', `${event.clientY - 40}px`)
      })
      .on('mouseleave', () => {
        tooltip.style('display', 'none')
      })

    return () => {
      tooltip.remove()
    }
  }, [nodes, storyId, getColor, router])

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <svg ref={svgRef} className="branch-tree w-full" />
    </div>
  )
}
