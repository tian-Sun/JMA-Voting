#!/usr/bin/env node

// 测试直接从API获取原始数据
const API_BASE_URL = 'https://lite-be.cfanfever.com/api/v1/fanfever'

async function testAPIRawData() {
  try {
    console.log('🔍 测试API原始数据返回...')
    console.log(`📡 API地址: ${API_BASE_URL}`)
    
    // AM50 榜单ID为1，获取first阶段数据
    const listId = 1
    const stage = 'first'
    const url = `${API_BASE_URL}/voteResult/${listId}?type=${stage}`
    
    console.log(`🌐 请求URL: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const apiData = await response.json()
    
    console.log('✅ API调用成功')
    console.log(`📊 总票数: ${apiData.total_votes?.toLocaleString()}`)
    console.log(`👥 艺人数量: ${apiData.data?.length}`)
    
    // 查找AM 50-22艺人
    const targetArtist = apiData.data.find(artist => 
      artist.talent_number === 'AM 50-22' ||
      artist.talent_number === 'AM50-22'
    )
    
    if (!targetArtist) {
      console.log('\n❌ 未找到AM 50-22艺人')
      console.log('\n📋 所有艺人的talent_number:')
      apiData.data.forEach((artist, index) => {
        console.log(`${index + 1}. ${artist.talent.artiste_nominated} - ${artist.talent_number}`)
      })
      return
    }
    
    console.log('\n✅ 找到目标艺人原始API数据:')
    console.log(`🎤 艺人: ${targetArtist.talent.artiste_nominated}`)
    console.log(`🏷️  编号: ${targetArtist.talent_number}`)
    console.log(`🏆 排名: #${targetArtist.rank}`)
    console.log(`📊 票数: ${targetArtist.votes?.toLocaleString()}`)
    
    console.log('\n🌐 API返回的平台数据 (data_source):')
    console.log('原始数据结构:')
    console.log(JSON.stringify(targetArtist.data_source, null, 2))
    
    if (targetArtist.data_source && targetArtist.data_source.length > 0) {
      console.log('\n📱 各平台票数详情:')
      let totalPlatformVotes = 0
      
      targetArtist.data_source.forEach(platform => {
        console.log(`   ${platform.platform}: ${platform.votes?.toLocaleString()} 票`)
        totalPlatformVotes += platform.votes || 0
      })
      
      console.log(`\n📊 统计对比:`)
      console.log(`   API返回的艺人总票数: ${targetArtist.votes?.toLocaleString()}`)
      console.log(`   平台票数总和: ${totalPlatformVotes.toLocaleString()}`)
      console.log(`   差异: ${(targetArtist.votes - totalPlatformVotes).toLocaleString()}`)
      
      if (targetArtist.votes === totalPlatformVotes) {
        console.log(`✅ API数据一致`)
      } else {
        console.log(`⚠️  API数据不一致！`)
      }
    } else {
      console.log('❌ API未返回平台数据')
    }
    
    // 显示完整的艺人信息结构
    console.log('\n📋 完整艺人数据结构:')
    console.log(JSON.stringify(targetArtist, null, 2))
    
  } catch (error) {
    console.error('❌ API测试失败:', error)
  }
}

testAPIRawData() 