const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormBtn = $messageForm.querySelector('button')
const $sendLoactionBtn = document.querySelector('#sendLoactionBtn')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

function autoScroll() {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight

    const currentScrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= currentScrollOffset) {
        $messages.scrollTo({top: $messages.scrollHeight, behavior: 'smooth'});
    }

}

socket.on('message', (msg) =>{
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
}) 

socket.on('loactionMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormBtn.setAttribute('disabled', 'disabled')

    const textValue = e.target.elements.message.value

    socket.emit('sendMessage', textValue, (error) => {
        $messageFormBtn.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('The message was delivered!')
    })
})

document.querySelector('#sendLoactionBtn').addEventListener('click', (e) =>{
    if (!navigator.geolocation) {
        return alert('Geoloaction is not supported by your browser')
    } 
    $sendLoactionBtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLoaction',  {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLoactionBtn.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })

})

socket.emit('join', {username, room}, (e) => {
    if (e) {
        alert(e)
        location.href = '/'
    }
})